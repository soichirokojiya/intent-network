import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAppClient } from "@/lib/twitter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function postWithAgentToken(accessToken: string, text: string) {
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

async function refreshAgentToken(agentId: string, refreshToken: string) {
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

// PATCH: Approve, reject, or edit a draft
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { action, text, rejectionReason } = body;

  if (!id) {
    return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
  }

  // Get draft
  const { data: draft, error: fetchErr } = await supabase
    .from("x_post_drafts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  if (action === "approve") {
    const tweetText = text || draft.text;

    try {
      // Try agent-level OAuth token first
      const { data: agent } = await supabase
        .from("owner_agents")
        .select("x_access_token, x_refresh_token")
        .eq("device_id", draft.device_id)
        .eq("config->>twitterEnabled", "true")
        .not("x_access_token", "is", null)
        .limit(1)
        .single();

      if (agent?.x_access_token) {
        // Post with agent's OAuth 2.0 token
        let result = await postWithAgentToken(agent.x_access_token, tweetText);

        // Retry with refreshed token on 401
        if (result.status === 401 && agent.x_refresh_token) {
          const agentRow = await supabase
            .from("owner_agents")
            .select("id")
            .eq("device_id", draft.device_id)
            .not("x_access_token", "is", null)
            .limit(1)
            .single();

          if (agentRow.data) {
            const newToken = await refreshAgentToken(agentRow.data.id, agent.x_refresh_token);
            result = await postWithAgentToken(newToken, tweetText);
          }
        }

        if (result.status !== 201) {
          return NextResponse.json({ error: result.data?.detail || "Tweet failed" }, { status: result.status });
        }

        await supabase
          .from("x_post_drafts")
          .update({
            status: "posted",
            text: tweetText,
            tweet_id: result.data.data.id,
            posted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        return NextResponse.json({ ok: true, tweetId: result.data.data.id, text: tweetText });
      }

      // Fallback: use app-level client
      const client = getAppClient();
      const result = await client.v2.tweet(tweetText);

      await supabase
        .from("x_post_drafts")
        .update({
          status: "posted",
          text: tweetText,
          tweet_id: result.data.id,
          posted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json({ ok: true, tweetId: result.data.id, text: tweetText });
    } catch (err: unknown) {
      console.error("X post error:", err);
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === "reject") {
    await supabase
      .from("x_post_drafts")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ ok: true, status: "rejected" });
  }

  if (action === "edit") {
    if (!text) {
      return NextResponse.json({ error: "text required for edit" }, { status: 400 });
    }

    await supabase
      .from("x_post_drafts")
      .update({
        text,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ ok: true, text });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
