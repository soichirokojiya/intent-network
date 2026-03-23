import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";

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
  const deviceId = getVerifiedUserId(req);
  if (!deviceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("query") || "";
  const messageId = req.nextUrl.searchParams.get("messageId") || "";
  const maxResults = req.nextUrl.searchParams.get("maxResults") || "10";

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

  // Helper: fetch with auto-refresh on 401
  async function gmailFetch(url: string): Promise<Response> {
    let res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (res.status === 401 && profile?.gmail_refresh_token) {
      const newToken = await refreshAccessToken(profile?.gmail_refresh_token);
      if (newToken) {
        accessToken = newToken;
        await supabase
          .from("profiles")
          .update({ gmail_access_token: newToken, updated_at: new Date().toISOString() })
          .eq("id", deviceId);
        res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      }
    }
    if (!res.ok && res.status === 401) {
      await supabase
        .from("profiles")
        .update({ gmail_connected: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
    }
    return res;
  }

  // Single message read mode
  if (messageId) {
    const res = await gmailFetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`
    );
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch message", connected: true }, { status: 500 });
    const detail = await res.json();
    const headers = detail.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    // Extract body text
    let bodyText = "";
    const extractText = (part: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }): void => {
      if (part.mimeType === "text/plain" && part.body?.data) {
        bodyText += Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
      if (part.parts) {
        (part.parts as typeof part[]).forEach(extractText);
      }
    };
    if (detail.payload) extractText(detail.payload);
    if (!bodyText) bodyText = detail.snippet || "";

    return NextResponse.json({
      message: {
        id: detail.id,
        subject: getHeader("Subject"),
        from: getHeader("From"),
        to: getHeader("To"),
        date: getHeader("Date"),
        body: bodyText.slice(0, 3000),
      },
      connected: true,
    });
  }

  // List/search mode
  const listUrl = query
    ? `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`
    : `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;

  const listRes = await gmailFetch(listUrl);
  if (!listRes.ok) {
    return NextResponse.json({ messages: [], connected: false });
  }

  const listData: GmailMessageListResponse = await listRes.json();
  const messageIds = listData.messages || [];

  // Fetch details for each message
  const messages = await Promise.all(
    messageIds.map(async (msg) => {
      const detailRes = await gmailFetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`
      );
      if (!detailRes.ok) return null;

      const detail: GmailMessageDetail = await detailRes.json();
      const hdrs = detail.payload?.headers || [];
      const getHeader = (name: string) =>
        hdrs.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

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
