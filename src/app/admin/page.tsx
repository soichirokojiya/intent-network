"use client";

import { useState, useEffect, useCallback } from "react";

interface Stats {
  totalUsers: number;
  activeUsersToday: number;
  totalMessages: number;
  totalTokens: number;
  totalRevenue: number;
  totalCharged: number;
  activeAgents: number;
}

function formatNumber(n: number): string {
  return n.toLocaleString("ja-JP");
}

function formatYen(n: number): string {
  return `${"\u00A5"}${n.toLocaleString("ja-JP", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
    } catch {
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const cards: { label: string; value: string; sub?: string }[] = stats
    ? [
        { label: "Total Users", value: formatNumber(stats.totalUsers), sub: "Registered accounts" },
        { label: "Active Today", value: formatNumber(stats.activeUsersToday), sub: "Users with messages today" },
        { label: "Total Messages", value: formatNumber(stats.totalMessages), sub: "All-time messages" },
        { label: "Total Tokens", value: formatNumber(stats.totalTokens), sub: "Input + Output tokens" },
        { label: "Total Revenue", value: formatYen(stats.totalRevenue), sub: "Usage cost (cost_yen)" },
        { label: "Total Charged", value: formatYen(stats.totalCharged), sub: "Charged amount" },
        { label: "Active Agents", value: formatNumber(stats.activeAgents), sub: "Owner agents" },
      ]
    : [];

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
          <h1 style={{ fontSize: "24px", fontWeight: 700 }}>musu.world Admin</h1>
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
              }}>
                <p style={{ fontSize: "13px", color: "#536471", marginBottom: "8px", fontWeight: 500 }}>
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
      </div>
    </div>
  );
}
