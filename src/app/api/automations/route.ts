import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { deviceId, name, triggerType, triggerConfig, actionType, actionConfig, agentId } = await req.json();
  if (!deviceId || !name || !triggerType || !actionType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase.from("automations").insert({
    device_id: deviceId,
    name,
    trigger_type: triggerType,
    trigger_config: triggerConfig || {},
    action_type: actionType,
    action_config: actionConfig || {},
    agent_id: agentId || null,
    enabled: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ automation: data, message: `自動化「${name}」を作成しました。1時間ごとにメールをチェックします。` });
}

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 });

  const { data } = await supabase.from("automations")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ automations: data || [] });
}

export async function DELETE(req: NextRequest) {
  const { deviceId, automationId } = await req.json();
  if (!deviceId || !automationId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  await supabase.from("automations").delete().eq("id", automationId).eq("device_id", deviceId);
  return NextResponse.json({ deleted: true });
}
