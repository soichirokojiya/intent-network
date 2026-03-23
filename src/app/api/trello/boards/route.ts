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

  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("trello_token, trello_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.trello_connected || !profile?.trello_token) {
    return NextResponse.json({ boards: [], connected: false });
  }

  const apiKey = process.env.TRELLO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Trello API key not configured" }, { status: 500 });
  }

  const token = profile.trello_token;

  try {
    // Fetch boards
    const boardsRes = await fetch(
      `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}&fields=name,url&filter=open`,
    );

    if (!boardsRes.ok) {
      if (boardsRes.status === 401) {
        // Token invalid, mark as disconnected
        await supabase
          .from("profiles")
          .update({ trello_connected: false, updated_at: new Date().toISOString() })
          .eq("id", deviceId);
      }
      return NextResponse.json({ boards: [], connected: false });
    }

    const boards = await boardsRes.json();

    // Fetch cards for each board (limit to first 5 boards)
    const boardsWithCards = await Promise.all(
      boards.slice(0, 5).map(async (board: { id: string; name: string; url: string }) => {
        try {
          const cardsRes = await fetch(
            `https://api.trello.com/1/boards/${board.id}/cards?key=${apiKey}&token=${token}&fields=name,desc,due,labels,idList&limit=50`,
          );
          if (!cardsRes.ok) return { name: board.name, url: board.url, cards: [] };
          const cards = await cardsRes.json();

          // Fetch lists for this board to get list names
          const listsRes = await fetch(
            `https://api.trello.com/1/boards/${board.id}/lists?key=${apiKey}&token=${token}&fields=name`,
          );
          const lists = listsRes.ok ? await listsRes.json() : [];
          const listMap: Record<string, string> = {};
          lists.forEach((l: { id: string; name: string }) => { listMap[l.id] = l.name; });

          return {
            name: board.name,
            url: board.url,
            cards: cards.map((c: { name: string; desc: string; due: string | null; labels: { name: string }[]; idList: string }) => ({
              name: c.name,
              description: c.desc ? c.desc.slice(0, 100) : "",
              due: c.due,
              labels: c.labels?.map((l: { name: string }) => l.name).filter(Boolean) || [],
              list: listMap[c.idList] || "",
            })),
          };
        } catch {
          return { name: board.name, url: board.url, cards: [] };
        }
      }),
    );

    return NextResponse.json({ boards: boardsWithCards, connected: true });
  } catch (err) {
    console.error("Trello boards fetch error:", err);
    return NextResponse.json({ boards: [], connected: false });
  }
}
