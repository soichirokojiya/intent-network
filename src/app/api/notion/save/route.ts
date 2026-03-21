import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { deviceId, title, content } = await req.json();

  if (!deviceId || !content) {
    return NextResponse.json({ error: "Missing deviceId or content" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("notion_token, notion_connected")
    .eq("id", deviceId)
    .single();

  if (!profile?.notion_connected || !profile?.notion_token) {
    return NextResponse.json({ error: "Notion not connected" }, { status: 400 });
  }

  const token = profile.notion_token;

  try {
    // Create a new page in the user's workspace
    // First, search for a "musu" database/page to use as parent
    const searchRes = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "musu", page_size: 1 }),
    });

    let parentId: string | null = null;
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.results?.length > 0) {
        parentId = searchData.results[0].id;
      }
    }

    // If no musu page found, create page at top level (workspace)
    const pageBody: Record<string, unknown> = {
      parent: parentId
        ? { page_id: parentId }
        : { type: "page_id", page_id: parentId || undefined },
      properties: {
        title: {
          title: [{ text: { content: title || "musu メモ" } }],
        },
      },
      children: content.split("\n").map((line: string) => ({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: line } }],
        },
      })),
    };

    // If no parent found, use workspace-level page creation
    if (!parentId) {
      // Search for any page to use as parent (Notion requires a parent)
      const anyPageRes = await fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 1 }),
      });
      if (anyPageRes.ok) {
        const anyData = await anyPageRes.json();
        if (anyData.results?.length > 0) {
          pageBody.parent = { page_id: anyData.results[0].id };
        }
      }
    }

    const createRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pageBody),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      if (createRes.status === 401) {
        await supabase.from("profiles").update({ notion_connected: false }).eq("id", deviceId);
      }
      return NextResponse.json({ error: "Failed to save to Notion", details: err }, { status: createRes.status });
    }

    const page = await createRes.json();
    return NextResponse.json({ ok: true, pageId: page.id, url: page.url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
