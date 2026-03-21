import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

interface GmailMessageListResponse {
  messages?: { id: string; threadId: string }[];
}

interface GmailMessageDetail {
  id: string;
  snippet: string;
  payload?: {
    headers?: { name: string; value: string }[];
  };
}

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  // Get stored tokens
  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("gmail_access_token, gmail_refresh_token, gmail_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.gmail_connected) {
    return NextResponse.json({ messages: [], connected: false });
  }

  let accessToken = profile.gmail_access_token;

  // Fetch message list
  let listRes = await fetch(
    "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  // If 401, try refresh
  if (listRes.status === 401 && profile.gmail_refresh_token) {
    const newToken = await refreshAccessToken(profile.gmail_refresh_token);
    if (newToken) {
      accessToken = newToken;
      // Save new access token
      await supabase
        .from("profiles")
        .update({ gmail_access_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", deviceId);

      listRes = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    }
  }

  if (!listRes.ok) {
    // Token is invalid, mark as disconnected
    if (listRes.status === 401) {
      await supabase
        .from("profiles")
        .update({ gmail_connected: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
    }
    return NextResponse.json({ messages: [], connected: false });
  }

  const listData: GmailMessageListResponse = await listRes.json();
  const messageIds = listData.messages || [];

  // Fetch details for each message
  const messages = await Promise.all(
    messageIds.map(async (msg) => {
      const detailRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!detailRes.ok) return null;

      const detail: GmailMessageDetail = await detailRes.json();
      const headers = detail.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      return {
        id: detail.id,
        subject: getHeader("Subject"),
        from: getHeader("From"),
        date: getHeader("Date"),
        snippet: detail.snippet,
      };
    }),
  );

  return NextResponse.json({
    messages: messages.filter(Boolean),
    connected: true,
  });
}
