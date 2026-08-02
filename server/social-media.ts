/**
 * Social Media Publishing Service
 *
 * Supports Buffer API and direct Meta/LinkedIn publishing.
 * Nastavení:
 * - BUFFER_ACCESS_TOKEN v .env (from Buffer OAuth)
 * - Nebo přímé API přístupy přes META_ACCESS_TOKEN, LINKEDIN_ACCESS_TOKEN
 */

interface SocialPost {
  content: string;
  platforms: ("facebook" | "instagram" | "linkedin" | "twitter")[];
  mediaUrl?: string;
  linkUrl?: string;
  scheduledAt?: Date; // null = publish immediately
}

interface PublishResult {
  platform: string;
  success: boolean;
  postId?: string;
  error?: string;
}

// ─── Buffer API ───────────────────────────────────────────────────────────────

async function getBufferProfiles(): Promise<Array<{ id: string; service: string; service_username: string }>> {
  const token = process.env.BUFFER_ACCESS_TOKEN?.trim();
  if (!token) return [];

  try {
    const response = await fetch("https://api.bufferapp.com/2/profiles.json", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function publishViaBuffer(post: SocialPost): Promise<PublishResult[]> {
  const token = process.env.BUFFER_ACCESS_TOKEN?.trim();
  if (!token) {
    return post.platforms.map(p => ({ platform: p, success: false, error: "Buffer not configured" }));
  }

  const profiles = await getBufferProfiles();
  const results: PublishResult[] = [];

  for (const platform of post.platforms) {
    const profile = profiles.find(p => p.service === platform);
    if (!profile) {
      results.push({ platform, success: false, error: `No ${platform} profile found in Buffer` });
      continue;
    }

    try {
      const body: Record<string, unknown> = {
        profile_ids: [profile.id],
        text: post.content,
        access_token: token,
      };
      if (post.mediaUrl) body.media = { photo: post.mediaUrl };
      if (post.linkUrl) body.link = post.linkUrl;
      if (post.scheduledAt) body.scheduled_at = Math.floor(post.scheduledAt.getTime() / 1000);

      const response = await fetch("https://api.bufferapp.com/2/updates/create.json", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(body as Record<string, string>).toString(),
      });

      const data = await response.json();
      results.push({
        platform,
        success: data.success || false,
        postId: data.updates?.[0]?.id,
        error: data.error,
      });
    } catch (error) {
      results.push({
        platform,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

// ─── LinkedIn Direct API ──────────────────────────────────────────────────────

export async function publishToLinkedIn(post: SocialPost): Promise<PublishResult> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const orgId = process.env.LINKEDIN_ORG_ID?.trim();

  if (!accessToken) {
    return { platform: "linkedin", success: false, error: "LinkedIn access token not configured" };
  }

  try {
    const author = orgId ? `urn:li:organization:${orgId}` : "urn:li:person:EMPTY";

    const shareBody: Record<string, unknown> = {
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: post.content },
          shareMediaCategory: post.mediaUrl ? "IMAGE" : post.linkUrl ? "ARTICLE" : "NONE",
          ...(post.mediaUrl && { media: [{ status: "READY", originalUrl: post.mediaUrl }] }),
          ...(post.linkUrl && { article: { source: post.linkUrl } }),
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(shareBody),
    });

    if (!response.ok) {
      const error = await response.text();
      return { platform: "linkedin", success: false, error: `LinkedIn API error: ${error}` };
    }

    const data = await response.json();
    return { platform: "linkedin", success: true, postId: data.id };
  } catch (error) {
    return { platform: "linkedin", success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─── Meta/Facebook Direct API ─────────────────────────────────────────────────

export async function publishToFacebook(post: SocialPost, pageId?: string): Promise<PublishResult> {
  const accessToken = process.env.META_ACCESS_TOKEN?.trim();
  const fbPageId = pageId || process.env.META_PAGE_ID?.trim();

  if (!accessToken || !fbPageId) {
    return { platform: "facebook", success: false, error: "Facebook page not configured" };
  }

  try {
    const body: Record<string, unknown> = {
      message: post.content,
      access_token: accessToken,
    };
    if (post.linkUrl) body.link = post.linkUrl;

    const response = await fetch(`https://graph.facebook.com/v19.0/${fbPageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      return { platform: "facebook", success: false, error: data.error?.message || "Unknown error" };
    }
    return { platform: "facebook", success: true, postId: data.id };
  } catch (error) {
    return { platform: "facebook", success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─── High-level publisher ─────────────────────────────────────────────────────

export async function publishSocialPost(post: SocialPost): Promise<PublishResult[]> {
  const results: PublishResult[] = [];

  // Try Buffer first (if configured)
  const bufferToken = process.env.BUFFER_ACCESS_TOKEN?.trim();
  if (bufferToken) {
    const bufferResults = await publishViaBuffer(post);
    results.push(...bufferResults);
    return results;
  }

  // Fallback to direct APIs
  if (post.platforms.includes("linkedin")) {
    results.push(await publishToLinkedIn(post));
  }
  if (post.platforms.includes("facebook")) {
    results.push(await publishToFacebook(post));
  }

  return results;
}

// ─── Content Generation Helpers ───────────────────────────────────────────────

export function generateSocialPostFromInquiry(inquiry: {
  name: string;
  businessDescription?: string;
  packageType?: string;
}): { content: string; hashtags: string[] } {
  const business = inquiry.businessDescription || "projekt";
  const hashtags = ["#optimateo", "#digitalniagentura", "#webdesign", "#marketing"];

  const content = `Nový projekt: ${business} 🚀\n\nTěšíme se na spolupráci s ${inquiry.name}! ${inquiry.packageType || "Web projekt"} je na cestě.\n\n${hashtags.join(" ")}`;

  return { content, hashtags };
}
