"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { useRouter, useSearchParams } from "next/navigation";

type IntegrationKey = "google" | "trello" | "gdrive" | "gmail" | "notion" | "x" | "slack" | "line" | "sheets" | "chatwork";

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
  { id: "sns", label: "SNS" },
];

const LOGO_MAP: Record<IntegrationKey, string> = {
  google: "/logos/google-calendar.jpg",
  gmail: "/logos/gmail.webp",
  gdrive: "/logos/google-drive.jpeg",
  trello: "/logos/trello.svg",
  notion: "/logos/notion.png",
  slack: "/logos/slack.png",
  line: "/logos/line.svg",
  x: "/logos/x.svg",
  sheets: "/logos/google-sheets.png",
  chatwork: "/logos/chatwork.png",
};

const integrations: Integration[] = [
  {
    key: "google",
    name: "Google Calendar",
    description: "チームが今日の予定を把握できるようになります。",
    authPath: "/api/google/auth",
    disconnectPath: "/api/google/disconnect",
    category: "google",
    icon: <img src={LOGO_MAP.google} alt="Google Calendar" width={20} height={20} className="rounded" />,
  },
  {
    key: "gmail",
    name: "Gmail",
    description: "チームがメールの内容を把握できるようになります。",
    authPath: "/api/gmail/auth",
    disconnectPath: "/api/gmail/disconnect",
    category: "google",
    icon: <img src={LOGO_MAP.gmail} alt="Gmail" width={20} height={20} className="rounded" />,
  },
  {
    key: "gdrive",
    name: "Google Drive",
    description: "チームがドライブのファイルを参照できるようになります。",
    authPath: "/api/google-drive/auth",
    disconnectPath: "/api/google-drive/disconnect",
    category: "google",
    icon: <img src={LOGO_MAP.gdrive} alt="Google Drive" width={20} height={20} className="rounded" />,
  },
  {
    key: "sheets",
    name: "Google Sheets",
    description: "チームがスプレッドシートの読み書きができるようになります。",
    authPath: "/api/google-sheets/auth",
    disconnectPath: "/api/google-sheets/disconnect",
    category: "google",
    icon: <img src={LOGO_MAP.sheets} alt="Google Sheets" width={20} height={20} className="rounded" />,
  },
  {
    key: "trello",
    name: "Trello",
    description: "チームがボードやタスクを把握できるようになります。",
    authPath: "/api/trello/auth",
    disconnectPath: "/api/trello/disconnect",
    category: "project",
    icon: <img src={LOGO_MAP.trello} alt="Trello" width={20} height={20} className="rounded" />,
  },
  {
    key: "notion",
    name: "Notion",
    description: "チームがNotionのページを参照できるようになります。",
    authPath: "/api/notion/auth",
    disconnectPath: "/api/notion/disconnect",
    category: "project",
    icon: <img src={LOGO_MAP.notion} alt="Notion" width={20} height={20} className="rounded" />,
  },
  {
    key: "slack",
    name: "Slack",
    description: "チームがSlackのチャンネルを把握できるようになります。",
    authPath: "/api/slack/auth",
    disconnectPath: "/api/slack/disconnect",
    category: "communication",
    icon: <img src={LOGO_MAP.slack} alt="Slack" width={20} height={20} className="rounded" />,
  },
  {
    key: "line",
    name: "LINE",
    description: "チームがLINEと連携できるようになります。",
    authPath: "/api/line/auth",
    disconnectPath: "/api/line/disconnect",
    category: "communication",
    icon: <img src={LOGO_MAP.line} alt="LINE" width={20} height={20} className="rounded" />,
  },
  {
    key: "chatwork",
    name: "Chatwork",
    description: "チームがChatworkのメッセージを読み書きできるようになります。",
    authPath: "/api/chatwork/auth",
    disconnectPath: "/api/chatwork/disconnect",
    category: "communication",
    icon: <img src={LOGO_MAP.chatwork} alt="Chatwork" width={20} height={20} className="rounded" />,
  },
  {
    key: "x",
    name: "X (Twitter)",
    description: "チームがXに投稿できるようになります。",
    authPath: "/api/x/auth",
    disconnectPath: "/api/x/disconnect",
    category: "sns",
    icon: <img src={LOGO_MAP.x} alt="X" width={20} height={20} className="rounded" />,
  },
];

const STATUS_MAP: Record<IntegrationKey, string> = {
  google: "googleCalendarConnected",
  trello: "trelloConnected",
  gdrive: "googleDriveConnected",
  gmail: "gmailConnected",
  notion: "notionConnected",
  x: "xConnected",
  slack: "slackConnected",
  line: "lineConnected",
  sheets: "sheetsConnected",
  chatwork: "chatworkConnected",
};

export default function IntegrationsPage() {
  const { updateScheduleDelivery } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [connected, setConnected] = useState<Record<IntegrationKey, boolean>>({
    google: false, trello: false, gdrive: false, gmail: false, notion: false, x: false, slack: false, line: false, sheets: false, chatwork: false,
  });
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [notionAutoSave, setNotionAutoSave] = useState(false);
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
        setNotionAutoSave(data.notionAutoSave);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Handle all OAuth callbacks
  useEffect(() => {
    const callbackKeys: IntegrationKey[] = ["google", "trello", "gdrive", "gmail", "notion", "x", "slack", "line", "sheets", "chatwork"];
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
                      <>
                        <button
                          onClick={() => handleDisconnect(integration)}
                          disabled={loading}
                          className="px-4 py-1.5 border border-[var(--card-border)] rounded-xl text-[13px] hover:bg-[var(--hover-bg)] disabled:opacity-50"
                        >
                          Disconnect
                        </button>
                        {integration.key === "notion" && (
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[13px]">決定事項をNotionに自動保存</span>
                            <button
                              onClick={async () => {
                                const newVal = !notionAutoSave;
                                setNotionAutoSave(newVal);
                                const deviceId = localStorage.getItem("musu_device_id") || "";
                                await fetch("/api/notion/toggle-auto-save", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ deviceId, enabled: newVal }),
                                });
                              }}
                              className={`w-11 h-6 rounded-full transition-colors relative ${notionAutoSave ? "bg-[var(--accent)]" : "bg-[var(--card-border)]"}`}
                            >
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notionAutoSave ? "translate-x-5" : ""}`} />
                            </button>
                          </div>
                        )}
                      </>
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
      {/* Request message */}
      <div className="mx-4 mt-8 p-4 rounded-xl bg-[var(--search-bg)] text-center">
        <p className="text-[13px] text-[var(--muted)]">
          連携したいアプリがありましたら
          <br />
          <a href="/contact" className="text-[var(--accent)] hover:underline">お問い合わせ</a>からご連絡ください
        </p>
      </div>
      <div className="h-20" />
    </>
  );
}
