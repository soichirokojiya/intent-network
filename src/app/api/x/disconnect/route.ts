import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { deviceId, agentId } = await req.json();
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 });
  }

  if (agentId) {
    // Disconnect agent-level X account
    const { error } = await supabase
      .from("owner_agents")
      .update({
        x_access_token: null,
        x_refresh_token: null,
        x_username: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)
      .eq("device_id", deviceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also update config
    const { data: agent } = await supabase
      .from("owner_agents")
      .select("config")
      .eq("id", agentId)
      .single();

    if (agent?.config) {
      const updatedConfig = {
        ...agent.config,
        twitterEnabled: false,
        twitterUsername: "",
      };
      await supabase
        .from("owner_agents")
        .update({ config: updatedConfig })
        .eq("id", agentId);
    }
  } else {
    // Legacy: Disconnect user-level X account
    const { error } = await supabase
      .from("profiles")
      .update({
        x_access_token: null,
        x_refresh_token: null,
        x_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
