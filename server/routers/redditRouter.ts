import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const redditRouter = router({
  searchDiscussions: protectedProcedure
    .input(
      z.object({
        keyword: z.string().min(1, "Keyword is required"),
        subreddit: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let url = `https://www.reddit.com/search.json?q=${encodeURIComponent(
          input.keyword
        )}&sort=new&limit=${input.limit}`;

        if (input.subreddit && input.subreddit.trim() !== "") {
          const cleanSub = input.subreddit.replace(/^(r\/|\/r\/)/, "");
          url = `https://www.reddit.com/r/${cleanSub}/search.json?q=${encodeURIComponent(
            input.keyword
          )}&restrict_sr=on&sort=new&limit=${input.limit}`;
        }

        const res = await fetch(url, {
          headers: {
            "User-Agent": "web:omnicore.scraper:1.0.0 (by /u/omnicore_admin)",
          },
        });

        if (!res.ok) {
          throw new Error(`Reddit API fetch failed: ${res.statusText}`);
        }

        const data = await res.json();

        if (!data.data || !data.data.children) {
          return [];
        }

        return data.data.children.map((child: any) => ({
          id: child.data.id,
          title: child.data.title,
          content: child.data.selftext,
          url: "https://reddit.com" + child.data.permalink,
          author: child.data.author,
          subreddit: child.data.subreddit_name_prefixed,
          createdUtc: child.data.created_utc,
          score: child.data.score,
          numComments: child.data.num_comments,
        }));
      } catch (error) {
        console.error("[Reddit Scraper] Error searching discussions:", error);
        throw new Error("Failed to search Reddit discussions");
      }
    }),
});
