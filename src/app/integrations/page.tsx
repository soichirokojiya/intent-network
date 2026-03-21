"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { useRouter, useSearchParams } from "next/navigation";

type IntegrationKey = "google" | "trello" | "gdrive" | "gmail" | "notion" | "x" | "freee" | "slack";

interface Integration {
  key: IntegrationKey;
  name: string;
  description: string;
  authPath: string;
  disconnectPath: string;
  category: string;
  icon: React.ReactNode;
}

const CATEGORIES = [
  { id: "google", label: "Google" },
  { id: "project", label: "プロジェクト管理" },
  { id: "communication", label: "コミュニケーション" },
  { id: "finance", label: "会計・ファイナンス" },
  { id: "sns", label: "SNS" },
];

const integrations: Integration[] = [
  {
    key: "google",
    name: "Google Calendar",
    description: "チームが今日の予定を把握できるようになります。",
    authPath: "/api/google/auth",
    disconnectPath: "/api/google/disconnect",
    category: "google",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1a73e8"/>
        <path d="M5.684 24l-5.684-5.684V5.684L5.684 0v24z" fill="#ea4335"/>
        <path d="M18.316 5.684L24 0H5.684l12.632 5.684z" fill="#4285f4"/>
        <path d="M5.684 24h12.632v-5.684H5.684V24z" fill="#0d652d"/>
        <path d="M0 5.684h5.684v12.632H0V5.684z" fill="#188038"/>
        <path d="M5.684 5.684h12.632v12.632H5.684V5.684z" fill="#fff"/>
        <path d="M9.2 16.4l-.9-.7c-.3-.3-.5-.6-.5-1s.3-.8.5-1l.9-.7-.5-.7-.9.5c-.5.4-.9.9-.9 1.6s.3 1.2.9 1.6l.9.5.5-.7zm2.8-5.6h-1.5v5.6h1.2v-2.1h.3c.8 0 1.5-.3 1.9-.8.2-.3.4-.7.4-1.1 0-.4-.1-.8-.4-1.1-.4-.3-1-.5-1.9-.5zm.1 2.4h-.4v-1.5h.4c.5 0 .9.1 1 .4.1.1.1.2.1.4 0 .1 0 .3-.1.4-.2.2-.5.3-1 .3z" fill="#1a73e8"/>
      </svg>
    ),
  },
  {
    key: "gmail",
    name: "Gmail",
    description: "チームがメールの内容を把握できるようになります。",
    authPath: "/api/gmail/auth",
    disconnectPath: "/api/gmail/disconnect",
    category: "google",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M2 6l10 7 10-7v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" fill="#ea4335"/>
        <path d="M22 6l-10 7L2 6V4a2 2 0 012-2h16a2 2 0 012 2v2z" fill="#c5221f"/>
        <path d="M2 6l10 7 10-7" fill="none" stroke="#fff" strokeWidth="0.5"/>
      </svg>
    ),
  },
  {
    key: "gdrive",
    name: "Google Drive",
    description: "チームがドライブのファイルを参照できるようになります。",
    authPath: "/api/google-drive/auth",
    disconnectPath: "/api/google-drive/disconnect",
    category: "google",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M8 2l8 0 4 7H4L8 2z" fill="#0066da"/>
        <path d="M16 2l4 7-8 13-4-7L16 2z" fill="#00ac47"/>
        <path d="M4 9l4 7-8 0 4-7z" fill="#ea4335"/>
        <path d="M4 9h16l-4 7H0l4-7z" fill="#00832d"/>
        <path d="M8 16l4-7 8 13H12l-4-6z" fill="#2684fc"/>
        <path d="M8 2l8 14H4L8 2z" fill="#ffba00"/>
      </svg>
    ),
  },
  {
    key: "trello",
    name: "Trello",
    description: "チームがボードやタスクを把握できるようになります。",
    authPath: "/api/trello/auth",
    disconnectPath: "/api/trello/disconnect",
    category: "project",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <rect width="24" height="24" rx="4" fill="#0079bf"/>
        <rect x="4" y="4" width="6.5" height="14" rx="1.2" fill="#fff"/>
        <rect x="13.5" y="4" width="6.5" height="9" rx="1.2" fill="#fff"/>
      </svg>
    ),
  },
  {
    key: "notion",
    name: "Notion",
    description: "チームがNotionのページを参照できるようになります。",
    authPath: "/api/notion/auth",
    disconnectPath: "/api/notion/disconnect",
    category: "project",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <rect width="24" height="24" rx="4" fill="#000"/>
        <path d="M5.5 4.5l9-1.5c.8-.1 1 0 1.5.3l3 2c.3.2.4.4.4.7v12c0 .5-.2.8-.7.9l-10 1.6c-.4.1-.6 0-.9-.3l-2.5-3.2c-.3-.4-.4-.6-.4-1V5.5c0-.5.2-.8.6-1z" fill="#fff"/>
        <path d="M13 7v9.5l-5 .8V7.8L13 7z" fill="#000"/>
      </svg>
    ),
  },
  {
    key: "slack",
    name: "Slack",
    description: "チームがSlackのチャンネルを把握できるようになります。",
    authPath: "/api/slack/auth",
    disconnectPath: "/api/slack/disconnect",
    category: "communication",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M5.5 9.5a2 2 0 110-4 2 2 0 010 4zm3 0h4a2 2 0 100-4h-4a2 2 0 100 4z" fill="#36c5f0"/>
        <path d="M14.5 5.5a2 2 0 114 0 2 2 0 01-4 0zm0 3v4a2 2 0 104 0v-4a2 2 0 10-4 0z" fill="#2eb67d"/>
        <path d="M18.5 14.5a2 2 0 110 4 2 2 0 010-4zm-3 0h-4a2 2 0 100 4h4a2 2 0 100-4z" fill="#ecb22e"/>
        <path d="M9.5 18.5a2 2 0 11-4 0 2 2 0 014 0zm0-3v-4a2 2 0 10-4 0v4a2 2 0 104 0z" fill="#e01e5a"/>
      </svg>
    ),
  },
  {
    key: "x",
    name: "X (Twitter)",
    description: "チームがXに投稿できるようになります。",
    authPath: "/api/x/auth",
    disconnectPath: "/api/x/disconnect",
    category: "sns",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <rect width="24" height="24" rx="4" fill="#000"/>
        <path d="M13.5 10.5L18.5 5h-1.2l-4.3 4.8L9.5 5H5l5.2 7.6L5 19h1.2l4.5-5.3L14.5 19H19l-5.5-8.5zm-1.6 1.9l-.5-.7L7 6h1.8l3.3 4.7.5.7L17 18h-1.8l-3.3-4.6z" fill="#fff"/>
      </svg>
    ),
  },
  {
    key: "freee",
    name: "freee",
    description: "ファイナンス担当が会計データを参照できるようになります。",
    authPath: "/api/freee/auth",
    disconnectPath: "/api/freee/disconnect",
    category: "finance",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <rect width="24" height="24" rx="4" fill="#2ecc71"/>
        <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">f</text>
      </svg>
    ),
  },
];

const STATUS_MAP: Record<IntegrationKey, string> = {
  google: "googleCalendarConnected",
  trello: "trelloConnected",
  gdrive: "googleDriveConnected",
  gmail: "gmailConnected",
  notion: "notionConnected",
  x: "xConnected",
  freee: "freeeConnected",
  slack: "slackConnected",
};

export default function IntegrationsPage() {
  const { updateScheduleDelivery } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connected, setConnected] = useState<Record<IntegrationKey, boolean>>({
    google: false, trello: false, gdrive: false, gmail: false, notion: false, x: false, freee: false, slack: false,
  });
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    if (!deviceId) return;
    try {
      const res = await fetch(`/api/integration-status?deviceId=${deviceId}`);
      if (res.ok) {
        const data = await res.json();
        const newConn: Record<string, boolean> = {};
        for (const [key, field] of Object.entries(STATUS_MAP)) {
          newConn[key] = data[field] ?? false;
        }
        setConnected(newConn as Record<IntegrationKey, boolean>);
        setScheduleEnabled(data.scheduleDeliveryEnabled);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Handle all OAuth callbacks
  useEffect(() => {
    const callbackKeys: IntegrationKey[] = ["google", "trello", "gdrive", "gmail", "notion", "x", "freee", "slack"];
    for (const key of callbackKeys) {
      const param = searchParams.get(key);
      if (param === "connected") {
        setMessage(`${integrations.find((i) => i.key === key)?.name} connected!`);
        fetchStatus();
      } else if (param === "error") {
        setError(`${integrations.find((i) => i.key === key)?.name} connection failed.`);
      }
    }
  }, [searchParams, fetchStatus]);

  const handleConnect = (integration: Integration) => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    window.location.href = `${integration.authPath}?deviceId=${deviceId}`;
  };

  const handleDisconnect = async (integration: Integration) => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    setLoading(true);
    const res = await fetch(integration.disconnectPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    if (res.ok) {
      setConnected((prev) => ({ ...prev, [integration.key]: false }));
      setMessage(`${integration.name} disconnected.`);
      setError("");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setError(`Failed to disconnect ${integration.name}.`);
      setMessage("");
    }
    setLoading(false);
  };

  const handleToggleSchedule = async () => {
    const newVal = !scheduleEnabled;
    setScheduleEnabled(newVal);
    await updateScheduleDelivery(newVal);
  };

  if (loading) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-lg font-bold">{t("nav.integrations")}</span>
        </header>
        <div className="flex items-center justify-center py-12">
          <span className="text-[var(--muted)] text-sm animate-pulse">Loading...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-bold">{t("nav.integrations")}</span>
      </header>

      <div className="px-4 py-6 space-y-6">
        {message && <div className="p-3 rounded-xl bg-[rgba(0,186,124,0.1)] text-[var(--green)] text-[14px]">{message}</div>}
        {error && <div className="p-3 rounded-xl bg-[rgba(244,33,46,0.1)] text-[var(--danger)] text-[14px]">{error}</div>}

        {CATEGORIES.map((cat) => {
          const items = integrations.filter((i) => i.category === cat.id);
          if (items.length === 0) return null;
          return (
            <div key={cat.id}>
              <h3 className="text-[13px] font-bold text-[var(--muted)] uppercase tracking-wider mb-3">{cat.label}</h3>
              <div className="space-y-4">
                {items.map((integration) => (
                  <div key={integration.key} className="p-4 bg-[var(--search-bg)] rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      {integration.icon}
                      <span className="text-[15px] font-bold">{integration.name}</span>
                      {connected[integration.key] && (
                        <span className="ml-auto text-[12px] text-[var(--green)] font-bold">Connected</span>
                      )}
                    </div>
                    <p className="text-[12px] text-[var(--muted)] mb-3">{integration.description}</p>
                    {connected[integration.key] ? (
                      <button
                        onClick={() => handleDisconnect(integration)}
                        disabled={loading}
                        className="px-4 py-1.5 border border-[var(--card-border)] rounded-xl text-[13px] hover:bg-[var(--hover-bg)] disabled:opacity-50"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(integration)}
                        className="w-full py-2 bg-[var(--accent)] text-white font-bold text-[13px] rounded-xl hover:bg-[var(--accent-hover)]"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-20" />
    </>
  );
}
