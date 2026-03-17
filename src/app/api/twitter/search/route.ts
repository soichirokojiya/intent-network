import { NextRequest, NextResponse } from "next/server";
import { getAppClient } from "@/lib/twitter";

export async function POST(req: NextRequest) {
  try {
    const { query, maxResults } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const client = getAppClient();

    const result = await client.v2.search(query, {
      max_results: maxResults || 10,
      "tweet.fields": ["created_at", "public_metrics", "author_id"],
      expansions: ["author_id"],
      "user.fields": ["name", "username", "profile_image_url"],
    });

    const tweets = result.data.data?.map((tweet) => {
      const author = result.includes?.users?.find((u) => u.id === tweet.author_id);
      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        metrics: tweet.public_metrics,
        author: author ? {
          name: author.name,
          username: author.username,
          avatar: author.profile_image_url,
        } : null,
      };
    }) || [];

    return NextResponse.json({ tweets });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json({ error: error.message || "Search failed" }, { status: 500 });
  }
}
