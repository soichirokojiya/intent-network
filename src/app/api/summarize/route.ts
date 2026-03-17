import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { messages, agentName } = await req.json();
    if (!messages || messages.length === 0) {
      return NextResponse.json({ summary: "" });
    }

    const conversation = messages
      .map((m: { role: string; text: string }) => `${m.role}: ${m.text}`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `以下は${agentName}とオーナーの過去の会話です。重要なポイントを簡潔に要約してください（3-5文）。具体的な数字、決定事項、依頼内容は必ず含めてください。

${conversation}

要約:`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ summary: text });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json({ summary: "" });
  }
}
