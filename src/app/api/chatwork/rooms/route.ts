import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function refreshToken(refreshTokenValue: string): Promise<string | null> {
  const res = await fetch("https://oauth.chatwork.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`${process.env.CHATWORK_CLIENT_ID}:${process.env.CHATWORK_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshTokenValue,
    }),
  });
  const data = await res.json();
  return data.access_token || null;
}

async function chatworkFetch(
  url: string,
  accessToken: string,
  deviceId: string,
  refreshTokenValue: string | null,
): Promise<{ data: unknown; newToken: string | null }> {
  let res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // If 401, try refreshing the token
  if (res.status === 401 && refreshTokenValue) {
    const newToken = await refreshToken(refreshTokenValue);
    if (newToken) {
      // Save new token
      await supabase
        .from("profiles")
        .update({ chatwork_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", deviceId);

      res = await fetch(url, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      return { data: await res.json(), newToken };
    }
  }

  return { data: await res.json(), newToken: null };
}

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  // Get stored tokens
  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("chatwork_token, chatwork_refresh_token, chatwork_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.chatwork_connected) {
    return NextResponse.json({ rooms: [], connected: false });
  }

  let accessToken = profile.chatwork_token;
  const chatworkRefreshToken = profile.chatwork_refresh_token;

  // List rooms
  const { data: roomsData, newToken } = await chatworkFetch(
    "https://api.chatwork.com/v2/rooms",
    accessToken,
    deviceId,
    chatworkRefreshToken,
  );

  if (newToken) {
    accessToken = newToken;
  }

  if (!Array.isArray(roomsData)) {
    // Token is invalid, mark as disconnected
    await supabase
      .from("profiles")
      .update({ chatwork_connected: false, updated_at: new Date().toISOString() })
      .eq("id", deviceId);
    return NextResponse.json({ rooms: [], connected: false });
  }

  // Get recent messages for the first 5 rooms
  const roomList = (roomsData as { room_id: number; name: string }[]).slice(0, 5);
  const rooms = await Promise.all(
    roomList.map(async (room) => {
      try {
        const { data: messagesData } = await chatworkFetch(
          `https://api.chatwork.com/v2/rooms/${room.room_id}/messages?force=1`,
          accessToken,
          deviceId,
          chatworkRefreshToken,
        );
        const messages = Array.isArray(messagesData)
          ? (messagesData as { body?: string; account?: { name?: string }; send_time?: number }[]).slice(0, 5).map((m) => ({
              body: m.body || "",
              account_name: m.account?.name || "",
              send_time: m.send_time || 0,
            }))
          : [];

        return { room_id: room.room_id, name: room.name, messages };
      } catch {
        return { room_id: room.room_id, name: room.name, messages: [] };
      }
    }),
  );

  return NextResponse.json({ rooms, connected: true });
}
