import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function refreshAccessToken(deviceId: string, refreshToken: string) {
  const clientId = process.env.X_CLIENT_ID!;
  const clientSecret = process.env.X_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.access_token) {
    throw new Error("Failed to refresh X token");
  }

  // Refresh tokens are single-use, save both new tokens
  await supabase
    .from("profiles")
    .update({
      x_access_token: tokens.access_token,
      x_refresh_token: tokens.refresh_token || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deviceId);

  return tokens.access_token as string;
}

async function refreshAgentAccessToken(agentId: string, refreshToken: string) {
  const clientId = process.env.X_CLIENT_ID!;
  const clientSecret = process.env.X_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokens.access_token) throw new Error("Failed to refresh agent X token");

  await supabase
    .from("owner_agents")
    .update({
      x_access_token: tokens.access_token,
      x_refresh_token: tokens.refresh_token || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId);

  return tokens.access_token as string;
}

async function postTweet(accessToken: string, text: string, mediaIds?: string[]) {
  const tweetBody: Record<string, unknown> = { text };
  if (mediaIds && mediaIds.length > 0) {
    tweetBody.media = { media_ids: mediaIds };
  }
  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(tweetBody),
  });

  return { status: res.status, data: await res.json() };
}

async function uploadMediaToX(accessToken: string, imageUrl: string): Promise<string | null> {
  try {
    // Download image from URL
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.error("[x/media] Failed to fetch image:", imageUrl, imgRes.status);
      return null;
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get("content-type") || "image/png";

    // Upload to X via v1.1 media upload (supports OAuth 2.0 Bearer)
    const formData = new FormData();
    formData.append("media_data", buffer.toString("base64"));
    formData.append("media_category", "tweet_image");

    const uploadRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("[x/media] Upload failed:", uploadRes.status, errText);
      // Fallback: try with app-level OAuth 1.0a via twitter-api-v2
      try {
        const { getAppClient } = await import("@/lib/twitter");
        const appClient = getAppClient();
        const mediaId = await appClient.v1.uploadMedia(buffer, { mimeType: contentType as "image/png" | "image/jpeg" | "image/gif" | "image/webp" });
        console.log("[x/media] Uploaded via app client, mediaId:", mediaId);
        return mediaId;
      } catch (appErr) {
        console.error("[x/media] App client upload also failed:", appErr);
        return null;
      }
    }

    const uploadData = await uploadRes.json();
    console.log("[x/media] Uploaded, mediaId:", uploadData.media_id_string);
    return uploadData.media_id_string;
  } catch (err) {
    console.error("[x/media] Upload error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deviceId = getVerifiedUserId(req) || body.deviceId;
    if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { agentId, text, mediaUrls } = body;

    if (!text) {
      return NextResponse.json(
        { error: "text required" },
        { status: 400 },
      );
    }

    // Try both possible device IDs (middleware verified + client-provided)
    const possibleIds = [...new Set([deviceId, body.deviceId].filter(Boolean))];
    console.log("[x/post] possibleIds:", possibleIds, "agentId:", agentId);

    // Try agent-level token first, then user-level
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    let tokenSource: "agent" | "profile" = "profile";
    let resolvedAgentId: string | null = agentId || null;

    // Try specific agent first, then any agent with X token for this user
    for (const id of possibleIds) {
      if (accessToken) break;
      if (agentId) {
        const { data: agent } = await supabase
          .from("owner_agents")
          .select("id, x_access_token, x_refresh_token")
          .eq("id", agentId)
          .eq("device_id", id)
          .maybeSingle();

        if (agent?.x_access_token) {
          accessToken = agent.x_access_token;
          refreshToken = agent.x_refresh_token;
          resolvedAgentId = agent.id;
          tokenSource = "agent";
        }
      }
    }

    // Fallback: user-level profile token (only if no agentId specified)
    if (!accessToken && !agentId) {
      for (const id of possibleIds) {
        if (accessToken) break;
        const { data: profile } = await supabase
          .from("profiles")
          .select("x_access_token, x_refresh_token")
          .eq("id", id)
          .maybeSingle();

        if (profile?.x_access_token) {
          accessToken = profile.x_access_token;
          refreshToken = profile.x_refresh_token;
        }
      }
    }

    if (!accessToken) {
      // Find which agent HAS X connected to give a helpful message
      let xConnectedAgentName = "";
      for (const id of possibleIds) {
        const { data: xAgent } = await supabase
          .from("owner_agents")
          .select("config, x_access_token")
          .eq("device_id", id)
          .not("x_access_token", "is", null)
          .limit(1)
          .maybeSingle();
        if (xAgent?.config?.name) { xConnectedAgentName = xAgent.config.name; break; }
      }
      const hint = xConnectedAgentName
        ? `このメンバーはX未連携だよ。@${xConnectedAgentName} に頼んでみて`
        : "X未連携です。設定→アカウント設定→アプリ連携からXを連携してください";
      console.error("[x/post] No X token for agent:", agentId, "hint:", hint);
      return NextResponse.json({ error: hint }, { status: 401 });
    }

    console.log("[x/post] Token found, source:", tokenSource, "posting text length:", text.length);

    // Upload media if provided
    let mediaIds: string[] | undefined;
    if (mediaUrls && Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      const uploadedIds: string[] = [];
      for (const url of mediaUrls.slice(0, 4)) { // X allows max 4 images
        const mediaId = await uploadMediaToX(accessToken!, url);
        if (mediaId) uploadedIds.push(mediaId);
      }
      if (uploadedIds.length > 0) mediaIds = uploadedIds;
      console.log("[x/post] Uploaded media:", uploadedIds.length, "of", mediaUrls.length);
    }

    // Try posting
    let result = await postTweet(accessToken!, text, mediaIds);

    // Handle 401 with refresh token
    if (result.status === 401 && refreshToken) {
      try {
        if (tokenSource === "agent" && resolvedAgentId) {
          accessToken = await refreshAgentAccessToken(resolvedAgentId, refreshToken);
        } else {
          accessToken = await refreshAccessToken(deviceId, refreshToken);
        }
        result = await postTweet(accessToken, text);
      } catch (refreshErr) {
        console.error("X token refresh failed:", refreshErr);
        return NextResponse.json(
          { error: "Xのトークンが期限切れです。設定→アプリ連携からXを再連携してください" },
          { status: 401 },
        );
      }
    }

    if (result.status !== 201) {
      console.error("X post failed:", JSON.stringify(result.data));
      const errorMsg = result.data?.detail || result.data?.errors?.[0]?.message || result.data?.title || "投稿に失敗しました";
      return NextResponse.json(
        { error: errorMsg },
        { status: result.status },
      );
    }

    return NextResponse.json({
      ok: true,
      tweetId: result.data.data.id,
    });
  } catch (error: any) {
    console.error("X post error:", error);
    return NextResponse.json(
      { error: error.message || "Tweet failed" },
      { status: 500 },
    );
  }
}
