/**
 * Radar — signal-based prospecting tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";
import {
  parseRedditListing,
  filterByKeywords,
  extractSignalsFromPosts,
  runRadarScan,
  type RedditPost,
} from "./radarAgent";

const mockLLM = vi.mocked(invokeLLM);

function llmResponse(content: string) {
  return {
    id: "test",
    created: 0,
    model: "test",
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
  } as any;
}

function makePost(overrides: Partial<RedditPost> = {}): RedditPost {
  return {
    id: "abc",
    subreddit: "smallbusiness",
    title: "Struggling to get leads for my agency",
    selftext: "We tried cold email but nothing works...",
    url: "https://www.reddit.com/r/smallbusiness/comments/abc/x/",
    createdUtc: 1750000000,
    ...overrides,
  };
}

beforeEach(() => {
  mockLLM.mockReset();
});

describe("parseRedditListing", () => {
  it("parses a valid reddit listing", () => {
    const payload = {
      data: {
        children: [
          {
            data: {
              id: "p1",
              subreddit: "Entrepreneur",
              title: "Need help with lead gen",
              selftext: "body text",
              permalink: "/r/Entrepreneur/comments/p1/need_help/",
              created_utc: 1750000000,
            },
          },
        ],
      },
    };
    const posts = parseRedditListing(payload);
    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe("p1");
    expect(posts[0].url).toBe("https://www.reddit.com/r/Entrepreneur/comments/p1/need_help/");
    expect(posts[0].subreddit).toBe("Entrepreneur");
  });

  it("returns empty array for malformed payloads", () => {
    expect(parseRedditListing(null)).toEqual([]);
    expect(parseRedditListing({})).toEqual([]);
    expect(parseRedditListing({ data: { children: "nope" } })).toEqual([]);
  });

  it("truncates very long selftext", () => {
    const payload = {
      data: { children: [{ data: { id: "p", title: "t", selftext: "x".repeat(5000), permalink: "/p" } }] },
    };
    expect(parseRedditListing(payload)[0].selftext.length).toBeLessThanOrEqual(2000);
  });
});

describe("filterByKeywords", () => {
  const posts = [
    makePost({ id: "1", title: "Need a new website for my cafe" }),
    makePost({ id: "2", title: "Best CRM for small teams?", selftext: "" }),
    makePost({ id: "3", title: "Random meme", selftext: "nothing here" }),
  ];

  it("keeps all posts when keywords empty", () => {
    expect(filterByKeywords(posts, [])).toHaveLength(3);
  });

  it("filters case-insensitively across title and body", () => {
    const result = filterByKeywords(posts, ["WEBSITE", "crm"]);
    expect(result.map((p) => p.id)).toEqual(["1", "2"]);
  });
});

describe("extractSignalsFromPosts", () => {
  it("returns only signals at or above minScore", async () => {
    mockLLM.mockResolvedValueOnce(
      llmResponse(
        JSON.stringify({
          signals: [
            { postId: "1", isSignal: true, painPoint: "no leads", opportunity: "offer audit", score: 85 },
            { postId: "2", isSignal: true, painPoint: "meh", opportunity: "weak", score: 40 },
            { postId: "3", isSignal: false, painPoint: "", opportunity: "", score: 0 },
          ],
        })
      )
    );
    const result = await extractSignalsFromPosts(
      [makePost({ id: "1" }), makePost({ id: "2" }), makePost({ id: "3" })],
      "web agency services",
      60
    );
    expect(result).toHaveLength(1);
    expect(result[0].postId).toBe("1");
  });

  it("returns empty array on LLM failure", async () => {
    mockLLM.mockRejectedValueOnce(new Error("down"));
    const result = await extractSignalsFromPosts([makePost()], "ctx", 60);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty input without calling LLM", async () => {
    const result = await extractSignalsFromPosts([], "ctx", 60);
    expect(result).toEqual([]);
    expect(mockLLM).not.toHaveBeenCalled();
  });
});

describe("runRadarScan", () => {
  it("skips known URLs and joins signals with their posts", async () => {
    const knownPost = makePost({ id: "old", url: "https://www.reddit.com/r/x/old/" });
    const freshPost = makePost({ id: "fresh", url: "https://www.reddit.com/r/x/fresh/" });

    // Mock fetch to return both posts for the single subreddit
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          children: [knownPost, freshPost].map((p) => ({
            data: {
              id: p.id,
              subreddit: p.subreddit,
              title: p.title,
              selftext: p.selftext,
              permalink: p.url.replace("https://www.reddit.com", ""),
              created_utc: p.createdUtc,
            },
          })),
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    mockLLM.mockResolvedValueOnce(
      llmResponse(
        JSON.stringify({
          signals: [
            { postId: "fresh", isSignal: true, painPoint: "p", opportunity: "o", score: 90 },
          ],
        })
      )
    );

    const result = await runRadarScan({
      subreddits: ["x"],
      keywords: [],
      offerContext: "web services",
      minScore: 60,
      knownUrls: new Set([knownPost.url]),
    });

    expect(result.scannedPosts).toBe(2);
    expect(result.signals).toHaveLength(1);
    expect(result.signals[0].post.id).toBe("fresh");

    vi.unstubAllGlobals();
  });
});
