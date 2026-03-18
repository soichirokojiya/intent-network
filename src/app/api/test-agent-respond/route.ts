import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function GET() {
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: "あなたは「Kai」というAIエージェントです。専門: マーケティング。口調: カジュアル。",
      messages: [{
        role: "user",
        content: `オーナーのメッセージ:
「フォロワー増加に向けたマーケティング戦略を立案してください」

JSON形式で出力してください（他の文字不要）:
{
  "toOwner": "オーナーへの返事"
}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsed = null;
    if (jsonMatch) {
      let jsonStr = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
      try { parsed = JSON.parse(jsonStr); } catch (e) { parsed = { parseError: String(e), jsonStr }; }
    }

    return NextResponse.json({ ok: true, text, parsed, usage: message.usage });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
