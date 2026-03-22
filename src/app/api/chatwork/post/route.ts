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

export async function POST(req: NextRequest) {
  const { deviceId, roomId, message } = await req.json();

  if (!deviceId || !roomId || !message) {
    return NextResponse.json({ error: "deviceId, roomId, and message are required" }, { status: 400 });
  }

  // Get stored tokens
  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("chatwork_token, chatwork_refresh_token, chatwork_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.chatwork_connected || !profile.chatwork_token) {
    return NextResponse.json({ error: "Chatwork not connected" }, { status: 401 });
  }

  let accessToken = profile.chatwork_token;

  // Post message (Chatwork requires application/x-www-form-urlencoded)
  let res = await fetch(`https://api.chatwork.com/v2/rooms/${roomId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: new URLSearchParams({ body: message }),
  });

  // If 401, try refreshing the token
  if (res.status === 401 && profile.chatwork_refresh_token) {
    const newToken = await refreshToken(profile.chatwork_refresh_token);
    if (newToken) {
      accessToken = newToken;
      await supabase
        .from("profiles")
        .update({ chatwork_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", deviceId);

      res = await fetch(`https://api.chatwork.com/v2/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: new URLSearchParams({ body: message }),
      });
    }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error("Chatwork post message failed:", errData);
    return NextResponse.json({ error: "Failed to post message" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ ok: true, message_id: data.message_id });
}
