/**
 * Radar — signal-based prospecting agent (AI Growth OS module)
 *
 * HERMES tech agent: monitors Reddit communities for posts where people
 * express pain points relevant to the user's offer, scores the opportunity
 * and stores high-fit posts as actionable signals (outreach / content topics).
 *
 * Autonomy: runRadarScan() is scheduler-callable — configure a watch once
 * and signals keep flowing in without prompting.
 */

import { invokeLLM } from "./_core/llm";

// ─── Reddit fetching (public JSON listing, no auth required) ────────────────────

export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  url: string;
  createdUtc: number; // unix seconds
}

/** Parse a Reddit listing JSON payload into normalized posts. Pure — easy to test. */
export function parseRedditListing(payload: unknown): RedditPost[] {
  const children = (payload as any)?.data?.children;
  if (!Array.isArray(children)) return [];
  return children
    .map((c: any) => c?.data)
    .filter((d: any) => d && typeof d.title === "string")
    .map((d: any) => ({
      id: String(d.id ?? ""),
      subreddit: String(d.subreddit ?? ""),
      title: String(d.title ?? ""),
      selftext: String(d.selftext ?? "").slice(0, 2000),
      url: `https://www.reddit.com${d.permalink ?? ""}`,
      createdUtc: Number(d.created_utc ?? 0),
    }));
}

/** Keep only posts mentioning at least one keyword (empty list = keep all). Pure. */
export function filterByKeywords(posts: RedditPost[], keywords: string[]): RedditPost[] {
  if (!keywords || keywords.length === 0) return posts;
  const lowered = keywords.map((k) => k.toLowerCase());
  return posts.filter((p) => {
    const haystack = `${p.title} ${p.selftext}`.toLowerCase();
    return lowered.some((k) => haystack.includes(k));
  });
}

export async function fetchRedditPosts(subreddit: string, limit = 25): Promise<RedditPost[]> {
  const sub = subreddit.replace(/^r\//i, "").trim();
  if (!sub) return [];
  try {
    const res = await fetch(`https://www.reddit.com/r/${encodeURIComponent(sub)}/new.json?limit=${limit}`, {
      headers: { "User-Agent": "LeadOS-Radar/1.0 (signal monitoring)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    return parseRedditListing(await res.json());
  } catch {
    return [];
  }
}

// ─── AI signal extraction ───────────────────────────────────────────────────────

export interface ExtractedSignal {
  postId: string;
  isSignal: boolean;
  painPoint: string;
  opportunity: string;
  score: number;
}

/**
 * Analyze posts with the LLM and return only real signals at/above minScore.
 * The offerContext grounds scoring in what the user actually sells.
 */
export async function extractSignalsFromPosts(
  posts: RedditPost[],
  offerContext: string,
  minScore: number
): Promise<ExtractedSignal[]> {
  if (posts.length === 0) return [];

  const postsBlock = posts
    .map((p, i) => `[${i}] id=${p.id} | r/${p.subreddit} | ${p.title}\n${p.selftext.slice(0, 500)}`)
    .join("\n---\n");

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are Radar — a B2B signal detection agent. The user sells: ${offerContext || "B2B services"}.

For each post decide whether the author expresses a PAIN POINT or BUYING SIGNAL relevant to the user's offer. Be strict: generic discussion, news, memes and self-promotion are NOT signals. A signal means a real person with a real problem the user could plausibly help with.

For signals, extract:
- painPoint: the problem in one sentence (author's perspective)
- opportunity: concrete outreach/content angle for the user (one sentence)
- score: 0-100 opportunity fit (100 = ideal prospect actively asking for this exact solution)

Respond with JSON only: {"signals": [{"postId": string, "isSignal": boolean, "painPoint": string, "opportunity": string, "score": number}, ...]} — one entry per post, in order.`,
        },
        { role: "user", content: postsBlock },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "radar_signals",
          strict: true,
          schema: {
            type: "object",
            properties: {
              signals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    postId: { type: "string" },
                    isSignal: { type: "boolean" },
                    painPoint: { type: "string" },
                    opportunity: { type: "string" },
                    score: { type: "number" },
                  },
                  required: ["postId", "isSignal", "painPoint", "opportunity", "score"],
                  additionalProperties: false,
                },
              },
            },
            required: ["signals"],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = result.choices[0].message.content;
    const parsed = JSON.parse(typeof raw === "string" ? raw : "{}") as { signals?: ExtractedSignal[] };
    return (parsed.signals ?? []).filter((s) => s.isSignal && s.score >= minScore);
  } catch {
    return [];
  }
}

// ─── Scan orchestration (db glue lives in the router) ───────────────────────────

export interface RadarScanResult {
  scannedPosts: number;
  matchedKeywords: number;
  signals: Array<ExtractedSignal & { post: RedditPost }>;
}

/**
 * Fetch + filter + analyze all subreddits of a watch. `knownUrls` are already
 * stored signal URLs — used to skip re-analyzing posts we have seen.
 */
export async function runRadarScan(params: {
  subreddits: string[];
  keywords: string[];
  offerContext: string;
  minScore: number;
  knownUrls: Set<string>;
}): Promise<RadarScanResult> {
  const all: RedditPost[] = [];
  for (const sub of params.subreddits.slice(0, 5)) {
    const posts = await fetchRedditPosts(sub);
    all.push(...posts);
  }

  const fresh = all.filter((p) => !params.knownUrls.has(p.url));
  const matched = filterByKeywords(fresh, params.keywords);
  // Cap the LLM batch to keep token usage bounded per scan
  const batch = matched.slice(0, 30);

  const extracted = await extractSignalsFromPosts(batch, params.offerContext, params.minScore);
  const byId = new Map(batch.map((p) => [p.id, p]));

  return {
    scannedPosts: all.length,
    matchedKeywords: matched.length,
    signals: extracted
      .filter((s) => byId.has(s.postId))
      .map((s) => ({ ...s, post: byId.get(s.postId)! })),
  };
}
