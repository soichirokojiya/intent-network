import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const deviceId = getVerifiedUserId(req);
  if (!deviceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get stored token
  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("notion_token, notion_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.notion_connected) {
    return NextResponse.json({ pages: [], connected: false });
  }

  const accessToken = profile.notion_token;

  // Search pages
  const searchRes = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      page_size: 20,
      sort: {
        direction: "descending",
        timestamp: "last_edited_time",
      },
    }),
  });

  if (!searchRes.ok) {
    // Token is invalid, mark as disconnected
    if (searchRes.status === 401) {
      await supabase
        .from("profiles")
        .update({ notion_connected: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
    }
    return NextResponse.json({ pages: [], connected: false });
  }

  const searchData = await searchRes.json();
  const pages = (searchData.results || [])
    .filter((item: { object: string }) => item.object === "page")
    .map(
      (page: {
        id: string;
        url: string;
        last_edited_time: string;
        properties?: {
          title?: { title?: Array<{ plain_text?: string }> };
          Name?: { title?: Array<{ plain_text?: string }> };
        };
      }) => {
        // Extract title from properties — Notion pages can use "title" or "Name"
        const titleProp =
          page.properties?.title?.title || page.properties?.Name?.title || [];
        const title =
          titleProp.map((t: { plain_text?: string }) => t.plain_text || "").join("") ||
          "(untitled)";

        return {
          id: page.id,
          title,
          url: page.url,
          lastEdited: page.last_edited_time,
        };
      },
    );

  return NextResponse.json({ pages, connected: true });
}
