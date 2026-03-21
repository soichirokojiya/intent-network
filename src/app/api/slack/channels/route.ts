import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  // Get stored tokens
  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("slack_access_token, slack_connected, slack_team_name")
    .eq("id", deviceId)
    .single();

  if (dbError || !profile?.slack_connected) {
    return NextResponse.json({ channels: [], connected: false });
  }

  const accessToken = profile.slack_access_token;

  // List channels
  const channelsRes = await fetch(
    "https://slack.com/api/conversations.list",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!channelsRes.ok) {
    return NextResponse.json({ channels: [], connected: false });
  }

  const channelsData = await channelsRes.json();

  if (!channelsData.ok) {
    // Token is invalid, mark as disconnected
    if (channelsData.error === "invalid_auth" || channelsData.error === "token_revoked") {
      await supabase
        .from("profiles")
        .update({ slack_connected: false, updated_at: new Date().toISOString() })
        .eq("id", deviceId);
    }
    return NextResponse.json({ channels: [], connected: false });
  }

  // Get recent messages for the first 5 channels
  const channelList = (channelsData.channels || []).slice(0, 5);
  const channels = await Promise.all(
    channelList.map(async (ch: { id: string; name: string }) => {
      const historyRes = await fetch(
        `https://slack.com/api/conversations.history?channel=${ch.id}&limit=5`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const historyData = await historyRes.json();
      const messages = historyData.ok
        ? (historyData.messages || []).map((m: { text?: string; user?: string; ts?: string }) => ({
            text: m.text || "",
            user: m.user || "",
            ts: m.ts || "",
          }))
        : [];

      return { name: ch.name, messages };
    }),
  );

  return NextResponse.json({ channels, connected: true });
}
