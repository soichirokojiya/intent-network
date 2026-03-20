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

  // --- User list ---
  const [usersRes, userCreditsRes, userMessagesRes, userAgentsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, email, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("user_credits")
        .select("device_id, balance_yen, total_used_yen, total_charged_yen"),
      supabase.from("owner_chats").select("device_id"),
      supabase.from("owner_agents").select("device_id"),
    ]);

  const creditsByDevice = new Map(
    (userCreditsRes.data || []).map(
      (c: {
        device_id: string;
        balance_yen: number | null;
        total_used_yen: number | null;
        total_charged_yen: number | null;
      }) => [c.device_id, c],
    ),
  );

  const messageCounts = new Map<string, number>();
  for (const m of userMessagesRes.data || []) {
    messageCounts.set(
      (m as { device_id: string }).device_id,
      (messageCounts.get((m as { device_id: string }).device_id) || 0) + 1,
    );
  }

  const agentCounts = new Map<string, number>();
  for (const a of userAgentsRes.data || []) {
    agentCounts.set(
      (a as { device_id: string }).device_id,
      (agentCounts.get((a as { device_id: string }).device_id) || 0) + 1,
    );
  }

  const users = (usersRes.data || []).map(
    (u: {
      id: string;
      display_name: string | null;
      email: string | null;
      created_at: string;
    }) => {
      const credits = creditsByDevice.get(u.id) as {
        balance_yen: number | null;
        total_used_yen: number | null;
        total_charged_yen: number | null;
      } | undefined;
      return {
        id: u.id,
        display_name: u.display_name,
        email: u.email,
        created_at: u.created_at,
        balance_yen: credits?.balance_yen ?? 0,
        total_used_yen: credits?.total_used_yen ?? 0,
        total_charged_yen: credits?.total_charged_yen ?? 0,
        message_count: messageCounts.get(u.id) || 0,
        agent_count: agentCounts.get(u.id) || 0,
      };
    },
  );

  // --- Usage log (last 50) ---
  const usageLogRes = await supabase
    .from("usage_log")
    .select("device_id, model, api_route, input_tokens, output_tokens, cost_yen, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    totalUsers: profilesRes.count || 0,
    activeUsersToday: activeDeviceIds.size,
    totalMessages: totalMessagesRes.count || 0,
    totalTokens,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCharged: Math.round(totalCharged * 100) / 100,
    activeAgents: agentsRes.count || 0,
    users,
    usageLog: usageLogRes.data || [],
  });
}
