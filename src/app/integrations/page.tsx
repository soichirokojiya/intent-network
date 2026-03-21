"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function IntegrationsPage() {
  const { googleCalendarConnected, trelloConnected, scheduleDeliveryEnabled, updateScheduleDelivery } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [gcalConnected, setGcalConnected] = useState(googleCalendarConnected);
  const [trelloConn, setTrelloConn] = useState(trelloConnected);
  const [scheduleEnabled, setScheduleEnabled] = useState(scheduleDeliveryEnabled);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { setGcalConnected(googleCalendarConnected); }, [googleCalendarConnected]);
  useEffect(() => { setTrelloConn(trelloConnected); }, [trelloConnected]);
  useEffect(() => { setScheduleEnabled(scheduleDeliveryEnabled); }, [scheduleDeliveryEnabled]);

  // Handle OAuth callback redirect
  useEffect(() => {
    const googleParam = searchParams.get("google");
    if (googleParam === "connected") {
      setGcalConnected(true);
      setMessage("Google Calendar connected!");
    } else if (googleParam === "error") {
      setError("Google Calendar connection failed.");
    }
    const trelloParam = searchParams.get("trello");
    if (trelloParam === "connected") {
      setTrelloConn(true);
      setMessage("Trello connected!");
    } else if (trelloParam === "error") {
      setError("Trello connection failed.");
    }
  }, [searchParams]);

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
          <h2 className="text-[15px] font-bold mb-3">Google Calendar</h2>
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
              <span className="text-[13px] text-[var(--muted)]">Morning schedule delivery (7:00 JST)</span>
              <button
                onClick={handleToggleSchedule}
                className={`relative w-11 h-6 rounded-full transition-colors ${scheduleEnabled ? "bg-[var(--accent)]" : "bg-[var(--card-border)]"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${scheduleEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>
          )}
        </div>

        {/* Trello */}
        <div>
          <h2 className="text-[15px] font-bold mb-3">Trello</h2>
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
