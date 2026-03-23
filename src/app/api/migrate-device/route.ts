import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerifiedUserId } from "@/lib/serverAuth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * 旧device_idのデータを新しいuser_idベースのdevice_idにマイグレーション。
 * ログイン時に1回呼ばれる。冪等（何度呼んでも安全）。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newDeviceId = getVerifiedUserId(req) || body.deviceId;
    if (!newDeviceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { oldDeviceId } = body;

    if (!oldDeviceId || oldDeviceId === newDeviceId) {
      return NextResponse.json({ migrated: false });
    }

    // Check if old device has data
    const { data: oldAgents } = await supabaseAdmin
      .from("owner_agents")
      .select("id")
      .eq("device_id", oldDeviceId)
      .limit(1);

    if (!oldAgents || oldAgents.length === 0) {
      return NextResponse.json({ migrated: false });
    }

    // Check if new device already has data (don't overwrite)
    const { data: newAgents } = await supabaseAdmin
      .from("owner_agents")
      .select("id")
      .eq("device_id", newDeviceId)
      .limit(1);

    if (newAgents && newAgents.length > 0) {
      // New device already has data, just clean up old
      return NextResponse.json({ migrated: false, reason: "new_device_has_data" });
    }

    // Migrate all tables with device_id column
    const tables = [
      "owner_agents", "owner_chats", "project_rooms", "user_credits", "usage_log",
      "project_facts", "automations", "x_post_drafts", "feedback_responses", "churn_surveys",
    ];
    for (const table of tables) {
      await supabaseAdmin
        .from(table)
        .update({ device_id: newDeviceId })
        .eq("device_id", oldDeviceId);
    }

    // Also update user_id where it exists
    const tablesWithUserId = ["owner_agents", "owner_chats"];
    for (const table of tablesWithUserId) {
      await supabaseAdmin
        .from(table)
        .update({ user_id: newDeviceId })
        .eq("user_id", oldDeviceId);
    }

    return NextResponse.json({ migrated: true });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
