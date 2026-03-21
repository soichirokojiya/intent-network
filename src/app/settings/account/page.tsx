"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AccountSettingsPage() {
  const { user, signOut } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();

  const [newsEnabled, setNewsEnabled] = useState(false);
  const [newsTime, setNewsTime] = useState("07:00");
  const [newsTimes, setNewsTimes] = useState<string[]>(["07:00"]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newTimeInput, setNewTimeInput] = useState("12:00");

  // Fetch news settings from server API
  const fetchNewsSettings = useCallback(async () => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    if (!deviceId) return;
    try {
      const res = await fetch(`/api/news-settings?deviceId=${deviceId}`);
      if (res.ok) {
        const data = await res.json();
        setNewsEnabled(data.newsEnabled);
        setNewsTime(data.newsTime);
        setNewsTimes(data.newsTimes);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchNewsSettings(); }, [fetchNewsSettings]);

  const updateNewsSettings = async (enabled: boolean, time: string, times: string[]) => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    if (!deviceId) return;
    // Optimistic UI update
    setNewsEnabled(enabled);
    setNewsTime(time);
    setNewsTimes(times);
    try {
      await fetch("/api/news-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, enabled, time, times }),
      });
    } catch {
      // Revert on failure
      fetchNewsSettings();
    }
  };

  const showMsg = (msg: string) => { setMessage(msg); setError(""); setTimeout(() => setMessage(""), 3000); };
  const showErr = (msg: string) => { setError(msg); setMessage(""); };

  const handleUpdateEmail = async () => {
    if (!newEmail) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) showErr(error.message);
    else showMsg("OK");
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) { showErr("Min 6 characters"); return; }
    if (newPassword !== confirmPassword) { showErr("Passwords don't match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) showErr(error.message);
    else { showMsg("OK"); setNewPassword(""); setConfirmPassword(""); }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t("settings.cancelConfirm"))) return;
    if (!confirm(t("settings.cancelConfirm2"))) return;
    setLoading(true);
    try {
      const deviceId = localStorage.getItem("musu_device_id") || "";
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, deviceId }),
      });
      if (!res.ok) {
        const data = await res.json();
        showErr(data.error || t("settings.cancelFailed"));
        setLoading(false);
        return;
      }
      localStorage.removeItem("musu_device_id");
      localStorage.clear();
      window.location.href = "/?signup=1";
    } catch {
      showErr(t("settings.cancelFailed"));
      setLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-bold">{t("nav.settings")}</span>
      </header>

      <div className="px-4 py-6 space-y-6">
        {message && <div className="p-3 rounded-xl bg-[rgba(0,186,124,0.1)] text-[var(--green)] text-[14px]">{message}</div>}
        {error && <div className="p-3 rounded-xl bg-[rgba(244,33,46,0.1)] text-[var(--danger)] text-[14px]">{error}</div>}

        {/* Language */}
        <div>
          <h2 className="text-[15px] font-bold mb-3">Language</h2>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 text-[15px] outline-none cursor-pointer"
          >
            {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* News Delivery */}
        <div>
          <h2 className="text-[15px] font-bold mb-3">{t("settings.newsDelivery")}</h2>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-[var(--muted)]">{t("settings.newsEnabled")}</span>
            <button
              onClick={() => updateNewsSettings(!newsEnabled, newsTime, newsTimes)}
              className={`relative w-11 h-6 rounded-full transition-colors ${newsEnabled ? "bg-[var(--accent)]" : "bg-[var(--card-border)]"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${newsEnabled ? "translate-x-5" : ""}`} />
            </button>
          </div>
          {newsEnabled && (
            <div>
              <label className="text-[13px] text-[var(--muted)] block mb-2">{t("settings.newsTime")}</label>
              {/* Current delivery times as chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {newsTimes.map((time) => (
                  <span
                    key={time}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--search-bg)] border border-[var(--card-border)] rounded-full text-[14px]"
                  >
                    {time}
                    {newsTimes.length > 1 && (
                      <button
                        onClick={() => {
                          const updated = newsTimes.filter((t) => t !== time);
                          updateNewsSettings(newsEnabled, updated[0], updated);
                        }}
                        className="ml-1 text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {/* Add new time */}
              <div className="flex gap-2">
                <input
                  type="time"
                  value={newTimeInput}
                  onChange={(e) => setNewTimeInput(e.target.value)}
                  className="bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]"
                />
                <button
                  onClick={() => {
                    if (newTimeInput && !newsTimes.includes(newTimeInput)) {
                      const updated = [...newsTimes, newTimeInput].sort();
                      updateNewsSettings(newsEnabled, updated[0], updated);
                    }
                  }}
                  disabled={!newTimeInput || newsTimes.includes(newTimeInput)}
                  className="px-4 py-2.5 bg-[var(--accent)] text-white font-bold text-sm rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <p className="text-[12px] text-[var(--muted)] mt-2">
                {locale === "ja" ? "チャットで「ニュースを7時と18時に送って」のように設定もできます" : "You can also set times by chatting, e.g. \"Send news at 7am and 6pm\""}
              </p>
            </div>
          )}
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* Email */}
        <div>
          <h2 className="text-[15px] font-bold mb-3">{t("settings.changeEmail")}</h2>
          <label className="text-[13px] text-[var(--muted)] block mb-1">{t("settings.newEmail")}</label>
          <div className="flex gap-2">
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              placeholder={user?.email || ""}
              className="flex-1 bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
            <button onClick={handleUpdateEmail} disabled={loading || !newEmail}
              className="px-4 py-2.5 bg-[var(--accent)] text-white font-bold text-sm rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50">
              {t("settings.update")}
            </button>
          </div>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* Password */}
        <div>
          <h2 className="text-[15px] font-bold mb-3">{t("settings.changePassword")}</h2>
          <div className="space-y-3">
            <div>
              <label className="text-[13px] text-[var(--muted)] block mb-1">{t("settings.newPassword")}</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("settings.minChars")}
                className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="text-[13px] text-[var(--muted)] block mb-1">{t("settings.confirmPassword")}</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("settings.repeatPassword")}
                className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
            </div>
            <button onClick={handleUpdatePassword} disabled={loading || !newPassword}
              className="w-full py-2.5 bg-[var(--accent)] text-white font-bold text-sm rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50">
              {t("settings.updatePassword")}
            </button>
          </div>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* Sign out */}
        <div className="pt-2">
          <button onClick={signOut} className="w-full py-2.5 border border-[var(--card-border)] rounded-xl text-sm font-bold hover:bg-[var(--hover-bg)]">
            {t("settings.signOut")}
          </button>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* Cancel Account */}
        <div className="pt-2">
          <h2 className="text-[15px] font-bold mb-2 text-[var(--danger)]">{t("settings.cancelAccount")}</h2>
          <p className="text-[13px] text-[var(--muted)] mb-4">
            {t("settings.cancelDesc")}
          </p>
          <button onClick={handleDeleteAccount} disabled={loading}
            className="w-full py-2.5 border border-[var(--danger)] text-[var(--danger)] rounded-xl text-sm font-bold hover:bg-[rgba(244,33,46,0.1)] disabled:opacity-50 transition-colors">
            {t("settings.deleteAccountBtn")}
          </button>
        </div>
      </div>
      <div className="h-20" />
    </>
  );
}
