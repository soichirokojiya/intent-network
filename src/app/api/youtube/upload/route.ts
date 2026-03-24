import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserIdWithBody } from "@/lib/serverAuth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export const maxDuration = 60;

async function refreshToken(deviceId: string, refreshToken: string): Promise<string | null> {
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
  if (!data.access_token) return null;

  const supabase = getSupabase();
  await supabase
    .from("profiles")
    .update({ youtube_access_token: data.access_token, updated_at: new Date().toISOString() })
    .eq("id", deviceId);

  return data.access_token;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const deviceId = getVerifiedUserIdWithBody(req, body);
  if (!deviceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, tags, privacyStatus, videoUrl } = body;
  // videoUrl: publicly accessible URL to the video file

  if (!title || !videoUrl) {
    return NextResponse.json({ error: "Missing title or videoUrl" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("youtube_access_token, youtube_refresh_token, youtube_connected")
    .eq("id", deviceId)
    .single();

  if (!profile?.youtube_connected || !profile.youtube_access_token) {
    return NextResponse.json({ error: "YouTube not connected" }, { status: 400 });
  }

  let accessToken = profile.youtube_access_token;

  // Download video from URL
  let videoBlob: Blob;
  try {
    const videoRes = await fetch(videoUrl, { signal: AbortSignal.timeout(30000) });
    if (!videoRes.ok) {
      return NextResponse.json({ error: "Failed to download video" }, { status: 400 });
    }
    videoBlob = await videoRes.blob();
  } catch (err) {
    return NextResponse.json({ error: `Video download failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 400 });
  }

  const metadata = {
    snippet: {
      title,
      description: description || "",
      tags: tags || [],
      categoryId: "22", // People & Blogs
    },
    status: {
      privacyStatus: privacyStatus || "private",
    },
  };

  async function doUpload(token: string) {
    // Resumable upload: initiate
    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": String(videoBlob.size),
          "X-Upload-Content-Type": videoBlob.type || "video/mp4",
        },
        body: JSON.stringify(metadata),
      },
    );

    if (initRes.status === 401) return { status: 401 };

    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) {
      const errBody = await initRes.text();
      return { status: initRes.status, error: errBody };
    }

    // Upload the video
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": videoBlob.type || "video/mp4" },
      body: videoBlob,
    });

    return { status: uploadRes.status, data: await uploadRes.json() };
  }

  let result = await doUpload(accessToken);

  // Retry with refreshed token
  if (result.status === 401 && profile.youtube_refresh_token) {
    const newToken = await refreshToken(deviceId, profile.youtube_refresh_token);
    if (newToken) {
      accessToken = newToken;
      result = await doUpload(accessToken);
    }
  }

  if (result.status !== 200 || !result.data?.id) {
    return NextResponse.json(
      { error: `Upload failed: ${result.error || JSON.stringify(result.data?.error)}` },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json({
    success: true,
    videoId: result.data.id,
    url: `https://www.youtube.com/watch?v=${result.data.id}`,
  });
}
