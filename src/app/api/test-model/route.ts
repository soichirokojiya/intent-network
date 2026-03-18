import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function GET() {
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 100,
      messages: [{ role: "user", content: 'Say "hello" in JSON: {"toOwner": "your message"}' }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "no text";
    return NextResponse.json({ ok: true, model: "claude-sonnet-4-6", text, usage: msg.usage });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
