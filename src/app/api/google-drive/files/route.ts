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

export async function GET(req: NextRequest) {
  const deviceId = getVerifiedUserId(req);
  if (!deviceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get stored tokens
  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("google_drive_token, google_drive_refresh_token, google_drive_connected")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.google_drive_connected) {
    return NextResponse.json({ files: [], connected: false });
  }

  let accessToken = profile.google_drive_token;

  const driveParams = new URLSearchParams({
    fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
    orderBy: "modifiedTime desc",
    pageSize: "20",
  });

  // Fetch files
  let driveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?${driveParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  // If 401, try refresh
  if (driveRes.status === 401 && profile.google_drive_refresh_token) {
    const newToken = await refreshAccessToken(profile.google_drive_refresh_token);
    if (newToken) {
      accessToken = newToken;
      // Save new access token
      await supabase
        .from("profiles")
        .update({ google_drive_token: newToken, updated_at: new Date().toISOString() })
        .eq("id", deviceId);

      driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?${driveParams}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    }
  }

  if (!driveRes.ok) {
    // Token is invalid, mark as disconnected
    if (driveRes.status === 401) {
      await supabase
        .from("profiles")
        .update({ google_drive_connected: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
    }
    return NextResponse.json({ files: [], connected: false });
  }

  const driveData = await driveRes.json();
  const files = (driveData.files || []).map((f: { id?: string; name?: string; mimeType?: string; modifiedTime?: string; webViewLink?: string }) => ({
    id: f.id || "",
    name: f.name || "(untitled)",
    mimeType: f.mimeType || "",
    modifiedTime: f.modifiedTime || "",
    webViewLink: f.webViewLink || "",
  }));

  return NextResponse.json({ files, connected: true });
}
