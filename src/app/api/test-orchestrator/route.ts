import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function GET() {
  try {
    const agents = [
      { id: "agent-default-1-test", name: "Kai", role: "マーケティング" },
      { id: "agent-default-2-test", name: "Sora", role: "リサーチ" },
    ];

    const agentList = agents.map((a) => `- ${a.name} (ID: ${a.id}, 役割: ${a.role})`).join("\n");

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `あなたはオーケストレーターです。

チームメンバー:
${agentList}

オーナーの指示: 「フォロワー増やしたい」

JSON形式で出力:
{
  "directResponse": "振り分け内容",
  "delegations": [{"agentId": "ID", "agentName": "名前", "task": "指示"}]
}`,
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsed = null;
    if (jsonMatch) {
      let jsonStr = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
      try { parsed = JSON.parse(jsonStr); } catch (e) { parsed = { parseError: String(e), jsonStr }; }
    }

    return NextResponse.json({
      ok: true,
      rawText: text,
      parsed,
    });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
