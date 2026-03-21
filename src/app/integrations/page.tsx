"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function IntegrationsPage() {
  const { updateScheduleDelivery } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [gcalConnected, setGcalConnected] = useState(false);
  const [trelloConn, setTrelloConn] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch connection status directly from DB via server API
  const fetchStatus = useCallback(async () => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    if (!deviceId) return;
    try {
      const res = await fetch(`/api/integration-status?deviceId=${deviceId}`);
      if (res.ok) {
        const data = await res.json();
        setGcalConnected(data.googleCalendarConnected);
        setTrelloConn(data.trelloConnected);
        setScheduleEnabled(data.scheduleDeliveryEnabled);
      }
    } catch {}
    setLoading(false);
  }, []);

  // Fetch on mount
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Handle OAuth callback redirect
  useEffect(() => {
    const googleParam = searchParams.get("google");
    if (googleParam === "connected") {
      setMessage("Google Calendar connected!");
      fetchStatus();
    } else if (googleParam === "error") {
      setError("Google Calendar connection failed.");
    }
    const trelloParam = searchParams.get("trello");
    if (trelloParam === "connected") {
      setMessage("Trello connected!");
      fetchStatus();
    } else if (trelloParam === "error") {
      setError("Trello connection failed.");
    }
  }, [searchParams, fetchStatus]);

  const showMsg = (msg: string) => { setMessage(msg); setError(""); setTimeout(() => setMessage(""), 3000); };
  const showErr = (msg: string) => { setError(msg); setMessage(""); };

  const handleConnectGoogle = () => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    window.location.href = `/api/google/auth?deviceId=${deviceId}`;
  };

  const handleConnectTrello = () => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    window.location.href = `/api/trello/auth?deviceId=${deviceId}`;
  };

  const handleDisconnectTrello = async () => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    setLoading(true);
    const res = await fetch("/api/trello/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    if (res.ok) {
      setTrelloConn(false);
      showMsg("Trello disconnected.");
    } else {
      showErr("Failed to disconnect Trello.");
    }
    setLoading(false);
  };

  const handleDisconnectGoogle = async () => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    setLoading(true);
    const res = await fetch("/api/google/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    if (res.ok) {
      setGcalConnected(false);
      showMsg("Google Calendar disconnected.");
    } else {
      showErr("Failed to disconnect.");
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

        {/* Google Calendar */}
        <div>
          <h2 className="text-[15px] font-bold mb-3 flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1a73e8"/>
              <path d="M5.684 24l-5.684-5.684V5.684L5.684 0v24z" fill="#ea4335"/>
              <path d="M18.316 5.684L24 0H5.684l12.632 5.684z" fill="#4285f4"/>
              <path d="M5.684 24h12.632v-5.684H5.684V24z" fill="#0d652d"/>
              <path d="M0 5.684h5.684v12.632H0V5.684z" fill="#188038"/>
              <path d="M5.684 5.684h12.632v12.632H5.684V5.684z" fill="#fff"/>
              <path d="M9.2 16.4l-.9-.7c-.3-.3-.5-.6-.5-1s.3-.8.5-1l.9-.7-.5-.7-.9.5c-.5.4-.9.9-.9 1.6s.3 1.2.9 1.6l.9.5.5-.7zm2.8-5.6h-1.5v5.6h1.2v-2.1h.3c.8 0 1.5-.3 1.9-.8.2-.3.4-.7.4-1.1 0-.4-.1-.8-.4-1.1-.4-.3-1-.5-1.9-.5zm.1 2.4h-.4v-1.5h.4c.5 0 .9.1 1 .4.1.1.1.2.1.4 0 .1 0 .3-.1.4-.2.2-.5.3-1 .3z" fill="#1a73e8"/>
            </svg>
            Google Calendar
          </h2>
          {gcalConnected ? (
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[var(--green)]">Connected</span>
              <button
                onClick={handleDisconnectGoogle}
                disabled={loading}
                className="px-4 py-2 border border-[var(--card-border)] rounded-xl text-sm hover:bg-[var(--hover-bg)] disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectGoogle}
              className="w-full py-2.5 bg-[var(--accent)] text-white font-bold text-sm rounded-xl hover:bg-[var(--accent-hover)]"
            >
              Connect Google Calendar
            </button>
          )}
          <p className="text-[12px] text-[var(--muted)] mt-2">
            Connect to let your agents see today&apos;s schedule.
          </p>
          {gcalConnected && (
            <div className="flex items-center justify-between mt-3">
              <div>
                <span className="text-[13px] text-[var(--muted)]">Morning schedule delivery</span>
                <p className="text-[11px] text-[var(--muted)] opacity-70 mt-0.5">Time can be set via chat with your agents</p>
              </div>
              <button
                onClick={handleToggleSchedule}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${scheduleEnabled ? "bg-[var(--accent)]" : "bg-[var(--card-border)]"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${scheduleEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>
          )}
        </div>

        {/* Trello */}
        <div>
          <h2 className="text-[15px] font-bold mb-3 flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <rect width="24" height="24" rx="4" fill="#0079bf"/>
              <rect x="4" y="4" width="6.5" height="14" rx="1.2" fill="#fff"/>
              <rect x="13.5" y="4" width="6.5" height="9" rx="1.2" fill="#fff"/>
            </svg>
            Trello
          </h2>
          {trelloConn ? (
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[var(--green)]">Connected</span>
              <button
                onClick={handleDisconnectTrello}
                disabled={loading}
                className="px-4 py-2 border border-[var(--card-border)] rounded-xl text-sm hover:bg-[var(--hover-bg)] disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectTrello}
              className="w-full py-2.5 bg-[var(--accent)] text-white font-bold text-sm rounded-xl hover:bg-[var(--accent-hover)]"
            >
              Connect Trello
            </button>
          )}
          <p className="text-[12px] text-[var(--muted)] mt-2">
            Connect to let your agents see your Trello boards and tasks.
          </p>
        </div>

      </div>
      <div className="h-20" />
    </>
  );
}
