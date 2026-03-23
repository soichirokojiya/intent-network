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

export async function POST(req: NextRequest) {
  const deviceId = getVerifiedUserId(req);
  if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, subject, body } = await req.json();

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Missing required fields (to, subject, body)" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gmail_access_token, gmail_refresh_token, gmail_connected")
    .eq("id", deviceId)
    .single();

  if (!profile?.gmail_connected || !profile?.gmail_access_token) {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
  }

  let accessToken = profile.gmail_access_token;

  // Build RFC 2822 email message
  const emailLines = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body).toString("base64"),
  ];
  const rawMessage = Buffer.from(emailLines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Send email
  let res = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawMessage }),
  });

  // Handle token refresh
  if (res.status === 401 && profile.gmail_refresh_token) {
    const newToken = await refreshAccessToken(profile.gmail_refresh_token);
    if (newToken) {
      accessToken = newToken;
      await supabase
        .from("profiles")
        .update({ gmail_access_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", deviceId);

      res = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawMessage }),
      });
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      await supabase
        .from("profiles")
        .update({ gmail_connected: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
    }
    await res.text();
    return NextResponse.json({ error: "Failed to send email" }, { status: res.status });
  }

  const result = await res.json();
  return NextResponse.json({ ok: true, messageId: result.id });
}
