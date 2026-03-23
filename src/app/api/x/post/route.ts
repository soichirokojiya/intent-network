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

async function postTweet(accessToken: string, text: string) {
  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text }),
  });

  return { status: res.status, data: await res.json() };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deviceId = getVerifiedUserId(req) || body.deviceId;
    if (!deviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { agentId, text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "text required" },
        { status: 400 },
      );
    }

    // Try agent-level token first, then user-level
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    let tokenSource: "agent" | "profile" = "profile";

    // Try specific agent first, then any agent with X token for this user
    if (agentId) {
      const { data: agent } = await supabase
        .from("owner_agents")
        .select("id, x_access_token, x_refresh_token")
        .eq("id", agentId)
        .eq("device_id", deviceId)
        .single();

      if (agent?.x_access_token) {
        accessToken = agent.x_access_token;
        refreshToken = agent.x_refresh_token;
        tokenSource = "agent";
      }
    }

    // Fallback: find any agent with X token for this user
    if (!accessToken) {
      const { data: anyAgent } = await supabase
        .from("owner_agents")
        .select("id, x_access_token, x_refresh_token")
        .eq("device_id", deviceId)
        .not("x_access_token", "is", null)
        .limit(1)
        .single();

      if (anyAgent?.x_access_token) {
        accessToken = anyAgent.x_access_token;
        refreshToken = anyAgent.x_refresh_token;
        tokenSource = "agent";
      }
    }

    if (!accessToken) {
      const { data: profile, error: dbError } = await supabase
        .from("profiles")
        .select("x_access_token, x_refresh_token")
        .eq("id", deviceId)
        .single();

      if (dbError || !profile?.x_access_token) {
        return NextResponse.json(
          { error: "X not connected" },
          { status: 401 },
        );
      }
      accessToken = profile.x_access_token;
      refreshToken = profile.x_refresh_token;
    }

    // Try posting
    let result = await postTweet(accessToken!, text);

    // Handle 401 with refresh token
    if (result.status === 401 && refreshToken) {
      if (tokenSource === "agent" && agentId) {
        // Refresh agent token
        accessToken = await refreshAgentAccessToken(agentId, refreshToken);
      } else {
        accessToken = await refreshAccessToken(deviceId, refreshToken);
      }
      result = await postTweet(accessToken, text);
    }

    if (result.status !== 201) {
      console.error("X post failed:", result.data);
      return NextResponse.json(
        { error: result.data?.detail || "Tweet failed" },
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
