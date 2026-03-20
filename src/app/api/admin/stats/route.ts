import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!process.env.ADMIN_PASSWORD || token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // Run all queries in parallel
  const [
    profilesRes,
    activeUsersRes,
    totalMessagesRes,
    tokensRes,
    revenueRes,
    chargedRes,
    agentsRes,
  ] = await Promise.all([
    // 1. Total registered users
    supabase.from("profiles").select("*", { count: "exact", head: true }),

    // 2. Active users today (distinct device_id with messages today)
    supabase
      .from("owner_chats")
      .select("device_id")
      .gte("created_at", todayISO),

    // 3. Total messages
    supabase.from("owner_chats").select("*", { count: "exact", head: true }),

    // 4. Total tokens used
    supabase
      .from("usage_log")
      .select("input_tokens, output_tokens")
      .neq("model", "charge"),

    // 5. Total revenue (cost_yen > 0)
    supabase
      .from("usage_log")
      .select("cost_yen")
      .gt("cost_yen", 0)
      .neq("model", "charge"),

    // 6. Total charged
    supabase.from("user_credits").select("total_charged_yen"),

    // 7. Active agents
    supabase.from("owner_agents").select("*", { count: "exact", head: true }),
  ]);

  // Compute active users today (distinct)
  const activeDeviceIds = new Set(
    (activeUsersRes.data || []).map((r: { device_id: string }) => r.device_id),
  );

  // Compute total tokens
  const totalTokens = (tokensRes.data || []).reduce(
    (sum: number, r: { input_tokens: number | null; output_tokens: number | null }) =>
      sum + (r.input_tokens || 0) + (r.output_tokens || 0),
    0,
  );

  // Compute total revenue
  const totalRevenue = (revenueRes.data || []).reduce(
    (sum: number, r: { cost_yen: number }) => sum + Number(r.cost_yen),
    0,
  );

  // Compute total charged
  const totalCharged = (chargedRes.data || []).reduce(
    (sum: number, r: { total_charged_yen: number | null }) =>
      sum + Number(r.total_charged_yen || 0),
    0,
  );

  return NextResponse.json({
    totalUsers: profilesRes.count || 0,
    activeUsersToday: activeDeviceIds.size,
    totalMessages: totalMessagesRes.count || 0,
    totalTokens,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCharged: Math.round(totalCharged * 100) / 100,
    activeAgents: agentsRes.count || 0,
  });
}
