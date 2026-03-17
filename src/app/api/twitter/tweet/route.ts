import { NextRequest, NextResponse } from "next/server";
import { getAppClient } from "@/lib/twitter";

export async function POST(req: NextRequest) {
  try {
    const { text, replyToId } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const client = getAppClient();

    const params: { text: string; reply?: { in_reply_to_tweet_id: string } } = { text };
    if (replyToId) {
      params.reply = { in_reply_to_tweet_id: replyToId };
    }

    const result = await client.v2.tweet(params);

    return NextResponse.json({
      success: true,
      tweetId: result.data.id,
      text: result.data.text,
    });
  } catch (error: any) {
    console.error("Tweet error:", error);
    return NextResponse.json({ error: error.message || "Tweet failed" }, { status: 500 });
  }
}
