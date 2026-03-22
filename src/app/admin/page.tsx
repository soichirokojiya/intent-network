"use client";

import { useState, useEffect, useCallback } from "react";

interface UserRow {
  id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  balance_yen: number;
  total_used_yen: number;
  total_charged_yen: number;
  message_count: number;
  agent_count: number;
  last_active_at: string | null;
  integrations_count: number;
  days_since_signup: number;
  is_active_7d: boolean;
}

interface UsageLogRow {
  device_id: string;
  model: string | null;
  api_route: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_yen: number | null;
  created_at: string;
}

interface IntegrationBreakdown {
  google_calendar: number;
  gmail: number;
  notion: number;
  trello: number;
  chatwork: number;
  square: number;
}

interface Stats {
  totalUsers: number;
  activeUsersToday: number;
  totalMessages: number;
  totalTokens: number;
  totalRevenue: number;
  totalCharged: number;
  activeAgents: number;
  wau: number;
  mau: number;
  retentionRate: number;
  avgMessagesPerUser: number;
  totalIntegrations: number;
  integrationBreakdown: IntegrationBreakdown;
  automationCount: number;
  users: UserRow[];
  usageLog: UsageLogRow[];
}

function formatNumber(n: number): string {
  return n.toLocaleString("ja-JP");
}

function formatYen(n: number): string {
  return `${"\u00A5"}${n.toLocaleString("ja-JP", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}日前`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}ヶ月前`;
}

function getUserStatus(user: UserRow): { label: string; color: string; bg: string; icon: string } {
  if (user.days_since_signup < 7) {
    return { label: "New", color: "#e0a800", bg: "#fef9e7", icon: "\uD83D\uDFE1" };
  }
  if (user.is_active_7d) {
    return { label: "Active", color: "#00ba7c", bg: "#e8f5ee", icon: "\uD83D\uDFE2" };
  }
  return { label: "Inactive", color: "#f4212e", bg: "#fde8e8", icon: "\uD83D\uDD34" };
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "usage" | "kpi">("users");
  const [signupEnabled, setSignupEnabled] = useState(true);

  const fetchSettings = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSignupEnabled(data.signup_enabled !== "false");
      }
    } catch {}
  }, []);

  const toggleSignup = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;
    const newValue = !signupEnabled;
    setSignupEnabled(newValue);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key: "signup_enabled", value: String(newValue) }),
    });
  }, [signupEnabled]);

  const fetchStats = useCallback(async (token: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setAuthed(false);
          sessionStorage.removeItem("admin_token");
          setError("Invalid password");
          return;
        }
        throw new Error("Failed to fetch stats");
      }
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
      fetchSettings(token);
    } catch {
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [fetchSettings]);

  // Check sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) {
      setAuthed(true);
      fetchStats(saved);
    }
  }, [fetchStats]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!authed) return;
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;
    const interval = setInterval(() => fetchStats(token), 60000);
    return () => clearInterval(interval);
  }, [authed, fetchStats]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    sessionStorage.setItem("admin_token", password);
    setAuthed(true);
    fetchStats(password);
  };

  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f9f9",
      }}>
        <form onSubmit={handleLogin} style={{
          background: "#fff",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "360px",
        }}>
          <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
            musu.world Admin
          </h1>
          <p style={{ fontSize: "14px", color: "#536471", marginBottom: "24px" }}>
            Enter admin password to continue
          </p>
          {error && (
            <p style={{ color: "#f4212e", fontSize: "14px", marginBottom: "12px" }}>{error}</p>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #eff3f4",
              fontSize: "16px",
              marginBottom: "16px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <button type="submit" style={{
            width: "100%",
            padding: "12px",
            borderRadius: "9999px",
            background: "#1d9bf0",
            color: "#fff",
            fontWeight: 700,
            fontSize: "15px",
            border: "none",
            cursor: "pointer",
          }}>
            Login
          </button>
        </form>
      </div>
    );
  }

  const cards: { label: string; value: string; sub?: string; accent?: string }[] = stats
    ? [
        { label: "Total Users", value: formatNumber(stats.totalUsers), sub: "Registered accounts" },
        { label: "Active Today", value: formatNumber(stats.activeUsersToday), sub: "Users with messages today" },
        { label: "Total Messages", value: formatNumber(stats.totalMessages), sub: "All-time messages" },
        { label: "Total Tokens", value: formatNumber(stats.totalTokens), sub: "Input + Output tokens" },
        { label: "Total Revenue", value: formatYen(stats.totalRevenue), sub: "Usage cost (cost_yen)" },
        { label: "Total Charged", value: formatYen(stats.totalCharged), sub: "Charged amount" },
        { label: "Active Agents", value: formatNumber(stats.activeAgents), sub: "Owner agents" },
        { label: "WAU", value: formatNumber(stats.wau), sub: "Weekly Active Users (7日)", accent: "#6366f1" },
        { label: "MAU", value: formatNumber(stats.mau), sub: "Monthly Active Users (30日)", accent: "#8b5cf6" },
        { label: "Retention", value: `${stats.retentionRate}%`, sub: "7日以上前の登録者の継続率", accent: "#0ea5e9" },
        { label: "Avg Messages", value: formatNumber(stats.avgMessagesPerUser), sub: "ユーザーあたり平均メッセージ数", accent: "#14b8a6" },
        { label: "Integrations", value: formatNumber(stats.totalIntegrations), sub: "アプリ連携の総接続数", accent: "#f59e0b" },
        { label: "Automations", value: formatNumber(stats.automationCount), sub: "有効な自動化ルール数", accent: "#ec4899" },
      ]
    : [];

  const activeIn7d = stats ? stats.users.filter((u) => u.is_active_7d).length : 0;
  const newThisWeek = stats ? stats.users.filter((u) => u.days_since_signup < 7).length : 0;
  const inactiveCount = stats ? stats.users.length - activeIn7d - newThisWeek : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f7f9f9",
      padding: "24px",
    }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "8px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 700 }}>musu.world Admin</h1>
            <button
              onClick={toggleSignup}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "9999px",
                border: `1px solid ${signupEnabled ? "#00ba7c" : "#f4212e"}`,
                background: signupEnabled ? "#e8f5ee" : "#fde8e8",
                color: signupEnabled ? "#00ba7c" : "#f4212e",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: signupEnabled ? "#00ba7c" : "#f4212e" }} />
              新規登録: {signupEnabled ? "公開中" : "停止中"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {lastUpdated && (
              <span style={{ fontSize: "13px", color: "#536471" }}>
                Updated: {lastUpdated.toLocaleTimeString("ja-JP")}
              </span>
            )}
            <button
              onClick={() => {
                const token = sessionStorage.getItem("admin_token");
                if (token) fetchStats(token);
              }}
              disabled={loading}
              style={{
                padding: "8px 16px",
                borderRadius: "9999px",
                background: "#1d9bf0",
                color: "#fff",
                fontWeight: 600,
                fontSize: "14px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("admin_token");
                setAuthed(false);
                setStats(null);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "9999px",
                background: "transparent",
                color: "#536471",
                fontWeight: 600,
                fontSize: "14px",
                border: "1px solid #eff3f4",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <p style={{ color: "#f4212e", marginBottom: "16px" }}>{error}</p>
        )}

        {loading && !stats ? (
          <p style={{ color: "#536471", textAlign: "center", marginTop: "60px" }}>Loading stats...</p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "16px",
          }}>
            {cards.map((card) => (
              <div key={card.label} style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                border: "1px solid #eff3f4",
                borderLeft: card.accent ? `4px solid ${card.accent}` : "1px solid #eff3f4",
              }}>
                <p style={{ fontSize: "13px", color: card.accent || "#536471", marginBottom: "8px", fontWeight: 500 }}>
                  {card.label}
                </p>
                <p style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2 }}>
                  {card.value}
                </p>
                {card.sub && (
                  <p style={{ fontSize: "12px", color: "#536471", marginTop: "8px" }}>
                    {card.sub}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        {stats && (
          <div style={{ marginTop: "32px" }}>
            <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #eff3f4", marginBottom: "16px" }}>
              {(["users", "usage", "kpi"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "12px 24px",
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === tab ? "2px solid #1d9bf0" : "2px solid transparent",
                    color: activeTab === tab ? "#0f1419" : "#536471",
                    fontWeight: activeTab === tab ? 700 : 500,
                    fontSize: "15px",
                    cursor: "pointer",
                  }}
                >
                  {tab === "users" ? "Users" : tab === "usage" ? "Usage Log" : "KPI"}
                </button>
              ))}
            </div>

            {activeTab === "users" && (
              <div style={{ overflowX: "auto", background: "#fff", borderRadius: "16px", border: "1px solid #eff3f4", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #eff3f4", textAlign: "left" }}>
                      {["Status", "Name", "Email", "Last Active", "Registered", "Integrations", "Balance", "Used", "Charged", "Messages", "Agents"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", fontWeight: 600, color: "#536471", fontSize: "13px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.users.map((u) => {
                      const status = getUserStatus(u);
                      return (
                        <tr key={u.id} style={{ borderBottom: "1px solid #eff3f4" }}>
                          <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 10px",
                              borderRadius: "9999px",
                              background: status.bg,
                              color: status.color,
                              fontSize: "12px",
                              fontWeight: 600,
                            }}>
                              {status.icon} {status.label}
                            </span>
                          </td>
                          <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>{u.display_name || "-"}</td>
                          <td style={{ padding: "10px 16px", whiteSpace: "nowrap", color: "#536471" }}>{u.email || "-"}</td>
                          <td style={{ padding: "10px 16px", whiteSpace: "nowrap", color: "#536471" }}>{relativeTime(u.last_active_at)}</td>
                          <td style={{ padding: "10px 16px", whiteSpace: "nowrap", color: "#536471" }}>{new Date(u.created_at).toLocaleDateString("ja-JP")}</td>
                          <td style={{ padding: "10px 16px", whiteSpace: "nowrap", textAlign: "center" }}>{u.integrations_count}</td>
                          <td style={{ padding: "10px 16px", whiteSpace: "nowrap", textAlign: "right" }}>{formatYen(u.balance_yen)}</td>
                          <td style={{ padding: "10px 16px", whiteSpace: "nowrap", textAlign: "right" }}>{formatYen(u.total_used_yen)}</td>
                          <td style={{ padding: "10px 16px", whiteSpace: "nowrap", textAlign: "right" }}>{formatYen(u.total_charged_yen)}</td>
                          <td style={{ padding: "10px 16px", whiteSpace: "nowrap", textAlign: "right" }}>{formatNumber(u.message_count)}</td>
                          <td style={{ padding: "10px 16px", whiteSpace: "nowrap", textAlign: "right" }}>{formatNumber(u.agent_count)}</td>
                        </tr>
                      );
                    })}
                    {stats.users.length === 0 && (
                      <tr><td colSpan={11} style={{ padding: "24px", textAlign: "center", color: "#536471" }}>No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "usage" && (
              <div style={{ overflowX: "auto", background: "#fff", borderRadius: "16px", border: "1px solid #eff3f4", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #eff3f4", textAlign: "left" }}>
                      {["Time", "User", "Model", "Route", "Input Tok", "Output Tok", "Cost"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", fontWeight: 600, color: "#536471", fontSize: "13px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.usageLog.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #eff3f4" }}>
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap", color: "#536471" }}>{new Date(row.created_at).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: "12px" }}>{row.device_id.slice(0, 8)}...</td>
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>{row.model || "-"}</td>
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap", color: "#536471" }}>{row.api_route || "-"}</td>
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap", textAlign: "right" }}>{formatNumber(row.input_tokens || 0)}</td>
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap", textAlign: "right" }}>{formatNumber(row.output_tokens || 0)}</td>
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap", textAlign: "right" }}>{formatYen(row.cost_yen || 0)}</td>
                      </tr>
                    ))}
                    {stats.usageLog.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#536471" }}>No usage log entries</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "kpi" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Integration Breakdown */}
                <div style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid #eff3f4",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "#0f1419" }}>
                    Integration Breakdown
                  </h3>
                  {[
                    { label: "Google Calendar", value: stats.integrationBreakdown.google_calendar },
                    { label: "Gmail", value: stats.integrationBreakdown.gmail },
                    { label: "Notion", value: stats.integrationBreakdown.notion },
                    { label: "Trello", value: stats.integrationBreakdown.trello },
                    { label: "Chatwork", value: stats.integrationBreakdown.chatwork },
                    { label: "Square", value: stats.integrationBreakdown.square },
                  ].map((item) => (
                    <div key={item.label} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid #f7f9f9",
                    }}>
                      <span style={{ fontSize: "14px", color: "#536471" }}>{item.label}</span>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        background: item.value > 0 ? "#e8f5ee" : "#f7f9f9",
                        color: item.value > 0 ? "#00ba7c" : "#536471",
                        padding: "2px 12px",
                        borderRadius: "9999px",
                      }}>
                        {item.value}件
                      </span>
                    </div>
                  ))}
                </div>

                {/* User Status Breakdown */}
                <div style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid #eff3f4",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "#0f1419" }}>
                    User Status Breakdown
                  </h3>
                  {[
                    { label: "\uD83D\uDFE2 Active (7日以内にメッセージ)", value: activeIn7d, color: "#00ba7c", bg: "#e8f5ee" },
                    { label: "\uD83D\uDFE1 New (登録7日以内)", value: newThisWeek, color: "#e0a800", bg: "#fef9e7" },
                    { label: "\uD83D\uDD34 Inactive (7日以上メッセージなし)", value: inactiveCount, color: "#f4212e", bg: "#fde8e8" },
                  ].map((item) => (
                    <div key={item.label} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      marginBottom: "8px",
                      borderRadius: "12px",
                      background: item.bg,
                    }}>
                      <span style={{ fontSize: "14px", color: "#0f1419" }}>{item.label}</span>
                      <span style={{ fontSize: "20px", fontWeight: 700, color: item.color }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    marginTop: "8px",
                    borderRadius: "12px",
                    background: "#f7f9f9",
                    borderTop: "2px solid #eff3f4",
                  }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f1419" }}>Total</span>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "#0f1419" }}>
                      {stats.users.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
