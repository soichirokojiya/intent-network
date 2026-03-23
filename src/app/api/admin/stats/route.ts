import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Run all queries in parallel
  const [
    profilesRes,
    activeUsersRes,
    totalMessagesRes,
    tokensRes,
    revenueRes,
    chargedRes,
    agentsRes,
    wauRes,
    mauRes,
    integrationsRes,
    automationCountRes,
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

    // 8. WAU - Weekly Active Users (distinct device_ids in last 7 days)
    supabase
      .from("owner_chats")
      .select("device_id")
      .gte("created_at", sevenDaysAgo),

    // 9. MAU - Monthly Active Users (distinct device_ids in last 30 days)
    supabase
      .from("owner_chats")
      .select("device_id")
      .gte("created_at", thirtyDaysAgo),

    // 10. Integration connections
    supabase
      .from("profiles")
      .select("google_calendar_connected, gmail_connected, notion_connected, trello_connected, chatwork_connected, square_connected"),

    // 11. Automation count (enabled)
    supabase.from("automations").select("*", { count: "exact", head: true }).eq("enabled", true),
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

  // Compute WAU (distinct device_ids in last 7 days)
  const wauDeviceIds = new Set(
    (wauRes.data || []).map((r: { device_id: string }) => r.device_id),
  );

  // Compute MAU (distinct device_ids in last 30 days)
  const mauDeviceIds = new Set(
    (mauRes.data || []).map((r: { device_id: string }) => r.device_id),
  );

  // Compute integration connections breakdown
  const integrationBreakdown = {
    google_calendar: 0,
    gmail: 0,
    notion: 0,
    trello: 0,
    chatwork: 0,
    square: 0,
  };
  let totalIntegrations = 0;
  for (const row of integrationsRes.data || []) {
    const r = row as {
      google_calendar_connected?: boolean;
      gmail_connected?: boolean;
      notion_connected?: boolean;
      trello_connected?: boolean;
      chatwork_connected?: boolean;
      square_connected?: boolean;
    };
    if (r.google_calendar_connected) { integrationBreakdown.google_calendar++; totalIntegrations++; }
    if (r.gmail_connected) { integrationBreakdown.gmail++; totalIntegrations++; }
    if (r.notion_connected) { integrationBreakdown.notion++; totalIntegrations++; }
    if (r.trello_connected) { integrationBreakdown.trello++; totalIntegrations++; }
    if (r.chatwork_connected) { integrationBreakdown.chatwork++; totalIntegrations++; }
    if (r.square_connected) { integrationBreakdown.square++; totalIntegrations++; }
  }

  const automationCount = automationCountRes.count || 0;

  // Compute avg messages per user
  const totalUsersCount = profilesRes.count || 0;
  const totalMessagesCount = totalMessagesRes.count || 0;
  const avgMessagesPerUser = totalUsersCount > 0 ? Math.round((totalMessagesCount / totalUsersCount) * 10) / 10 : 0;

  // --- User list ---
  const [usersRes, userCreditsRes, userMessagesRes, userAgentsRes, userLastActiveRes, userIntegrationsRes] =
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
      // Last active message per user
      supabase.from("owner_chats").select("device_id, created_at").order("created_at", { ascending: false }),
      // Integration flags per user
      supabase.from("profiles").select("id, google_calendar_connected, gmail_connected, notion_connected, trello_connected, chatwork_connected, square_connected"),
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

  // Build last_active_at map (first occurrence per device_id since sorted desc)
  const lastActiveMap = new Map<string, string>();
  for (const row of userLastActiveRes.data || []) {
    const r = row as { device_id: string; created_at: string };
    if (!lastActiveMap.has(r.device_id)) {
      lastActiveMap.set(r.device_id, r.created_at);
    }
  }

  // Build integrations count per user
  const userIntegrationsMap = new Map<string, number>();
  for (const row of userIntegrationsRes.data || []) {
    const r = row as {
      id: string;
      google_calendar_connected?: boolean;
      gmail_connected?: boolean;
      notion_connected?: boolean;
      trello_connected?: boolean;
      chatwork_connected?: boolean;
      square_connected?: boolean;
    };
    let count = 0;
    if (r.google_calendar_connected) count++;
    if (r.gmail_connected) count++;
    if (r.notion_connected) count++;
    if (r.trello_connected) count++;
    if (r.chatwork_connected) count++;
    if (r.square_connected) count++;
    userIntegrationsMap.set(r.id, count);
  }

  const nowMs = now.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

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
      const lastActive = lastActiveMap.get(u.id) || null;
      const daysSinceSignup = Math.floor((nowMs - new Date(u.created_at).getTime()) / (24 * 60 * 60 * 1000));
      const isActive7d = lastActive ? (nowMs - new Date(lastActive).getTime()) < sevenDaysMs : false;
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
        last_active_at: lastActive,
        integrations_count: userIntegrationsMap.get(u.id) || 0,
        days_since_signup: daysSinceSignup,
        is_active_7d: isActive7d,
      };
    },
  );

  // Sort users by last_active_at descending (most recently active first)
  users.sort((a, b) => {
    if (!a.last_active_at && !b.last_active_at) return 0;
    if (!a.last_active_at) return 1;
    if (!b.last_active_at) return -1;
    return new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime();
  });

  // Compute retention rate: users registered >7 days ago who sent a message in last 7 days
  const usersOlderThan7d = users.filter((u) => u.days_since_signup > 7);
  const retainedUsers = usersOlderThan7d.filter((u) => u.is_active_7d);
  const retentionRate = usersOlderThan7d.length > 0
    ? Math.round((retainedUsers.length / usersOlderThan7d.length) * 1000) / 10
    : 0;

  // --- Usage log (last 50) ---
  const usageLogRes = await supabase
    .from("usage_log")
    .select("device_id, model, api_route, input_tokens, output_tokens, cost_yen, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    totalUsers: profilesRes.count || 0,
    activeUsersToday: activeDeviceIds.size,
    totalMessages: totalMessagesCount,
    totalTokens,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCharged: Math.round(totalCharged * 100) / 100,
    activeAgents: agentsRes.count || 0,
    wau: wauDeviceIds.size,
    mau: mauDeviceIds.size,
    retentionRate,
    avgMessagesPerUser,
    totalIntegrations,
    integrationBreakdown,
    automationCount,
    users,
    usageLog: usageLogRes.data || [],
  });
}
