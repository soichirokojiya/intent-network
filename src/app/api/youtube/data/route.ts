import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

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

export async function GET(req: NextRequest) {
  const deviceId = getVerifiedUserId(req);
  if (!deviceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") || "channel";
  // type: "channel" | "videos" | "analytics"

  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("youtube_access_token, youtube_refresh_token, youtube_channel_id, youtube_connected")
    .eq("id", deviceId)
    .single();

  if (!profile?.youtube_connected || !profile.youtube_access_token) {
    return NextResponse.json({ error: "YouTube not connected" }, { status: 400 });
  }

  let accessToken = profile.youtube_access_token;

  async function fetchYT(url: string, token: string) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return { status: 401, data: null };
    return { status: res.status, data: await res.json() };
  }

  async function fetchWithRefresh(url: string) {
    let result = await fetchYT(url, accessToken);
    if (result.status === 401 && profile!.youtube_refresh_token) {
      const newToken = await refreshToken(deviceId!, profile!.youtube_refresh_token);
      if (newToken) {
        accessToken = newToken;
        result = await fetchYT(url, accessToken);
      }
    }
    return result;
  }

  try {
    switch (type) {
      case "channel": {
        const result = await fetchWithRefresh(
          "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true",
        );
        if (!result.data) return NextResponse.json({ error: "Failed to fetch channel" }, { status: 500 });
        const channel = result.data.items?.[0];
        return NextResponse.json({
          id: channel?.id,
          title: channel?.snippet?.title,
          description: channel?.snippet?.description,
          subscriberCount: channel?.statistics?.subscriberCount,
          videoCount: channel?.statistics?.videoCount,
          viewCount: channel?.statistics?.viewCount,
          thumbnail: channel?.snippet?.thumbnails?.default?.url,
        });
      }

      case "videos": {
        const maxResults = req.nextUrl.searchParams.get("max") || "10";
        const result = await fetchWithRefresh(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=${maxResults}&order=date`,
        );
        if (!result.data) return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });

        const videoIds = result.data.items?.map((v: { id: { videoId: string } }) => v.id.videoId).join(",");
        if (!videoIds) return NextResponse.json({ videos: [] });

        // Get statistics for each video
        const statsResult = await fetchWithRefresh(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
        );

        const videos = statsResult.data?.items?.map((v: {
          id: string;
          snippet: { title: string; publishedAt: string; thumbnails: { default: { url: string } } };
          statistics: { viewCount: string; likeCount: string; commentCount: string };
        }) => ({
          id: v.id,
          title: v.snippet.title,
          publishedAt: v.snippet.publishedAt,
          thumbnail: v.snippet.thumbnails?.default?.url,
          views: v.statistics?.viewCount,
          likes: v.statistics?.likeCount,
          comments: v.statistics?.commentCount,
        })) || [];

        return NextResponse.json({ videos });
      }

      case "analytics": {
        if (!profile.youtube_channel_id) {
          return NextResponse.json({ error: "Channel ID not found" }, { status: 400 });
        }
        const startDate = req.nextUrl.searchParams.get("start") || new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];
        const endDate = req.nextUrl.searchParams.get("end") || new Date().toISOString().split("T")[0];

        const result = await fetchWithRefresh(
          `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${profile.youtube_channel_id}&startDate=${startDate}&endDate=${endDate}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained&dimensions=day&sort=day`,
        );
        if (!result.data) return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });

        return NextResponse.json({
          rows: result.data.rows || [],
          columnHeaders: result.data.columnHeaders || [],
        });
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `YouTube API error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
