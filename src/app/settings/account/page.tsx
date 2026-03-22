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

  const [newsEnabled, setNewsEnabled] = useState(true);
  const [newsTime, setNewsTime] = useState("07:00");
  const [newsTimes, setNewsTimes] = useState<string[]>(["07:00"]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteSurvey, setShowDeleteSurvey] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteComment, setDeleteComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newTimeInput, setNewTimeInput] = useState("12:00");
  const [scheduleEnabled, setScheduleEnabled] = useState(true);

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

  // Fetch schedule delivery status
  useEffect(() => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    if (!deviceId) return;
    fetch(`/api/integration-status?deviceId=${deviceId}`)
      .then((r) => r.json())
      .then((d) => { if (d.scheduleDeliveryEnabled !== undefined) setScheduleEnabled(d.scheduleDeliveryEnabled); })
      .catch(() => {});
  }, []);

  const updateNewsSettings = async (enabled: boolean, time: string, times: string[]) => {
    const deviceId = localStorage.getItem("musu_device_id") || "";
    if (!deviceId) return;
    setNewsEnabled(enabled);
    try {
      const res = await fetch("/api/news-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, enabled, time, times }),
      });
      if (!res.ok) {
        // Revert on failure
        fetchNewsSettings();
      }
    } catch {
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
    setShowDeleteSurvey(true);
  };

  const executeDelete = async () => {
    setLoading(true);
    try {
      const deviceId = localStorage.getItem("musu_device_id") || "";
      // Save churn survey
      if (deleteReason || deleteComment) {
        await fetch("/api/admin/churn-survey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId, userId: user?.id, email: user?.email, reason: deleteReason, comment: deleteComment }),
        }).catch(() => {});
      }
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
          <p className="text-[11px] text-[var(--muted)] opacity-70 mt-1">
            {locale === "ja" ? "配信時間はエージェントにチャットで伝えてください" : "Set delivery time via chat with your agents"}
          </p>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* Schedule Delivery */}
        <div>
          <h2 className="text-[15px] font-bold mb-3">{locale === "ja" ? "予定配信" : "Schedule Delivery"}</h2>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[13px] text-[var(--muted)]">{locale === "ja" ? "秘書から予定を配信" : "Schedule delivery from secretary"}</span>
              <p className="text-[11px] text-[var(--muted)] opacity-70 mt-0.5">
                {locale === "ja" ? "時間はエージェントにチャットで伝えてください" : "Time can be set via chat with your agents"}
              </p>
            </div>
            <button
              onClick={async () => {
                const deviceId = localStorage.getItem("musu_device_id") || "";
                if (!deviceId) return;
                const newVal = !scheduleEnabled;
                setScheduleEnabled(newVal);
                await fetch("/api/delivery-settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ deviceId, action: newVal ? "enable_schedule" : "disable_schedule" }),
                });
              }}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${scheduleEnabled ? "bg-[var(--accent)]" : "bg-[var(--card-border)]"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${scheduleEnabled ? "translate-x-5" : ""}`} />
            </button>
          </div>
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

        {/* Links */}
        <div className="space-y-1">
          <button onClick={() => router.push("/settings")} className="w-full flex items-center justify-between py-3 px-1 text-[15px] hover:bg-[var(--hover-bg)] rounded-lg transition-colors">
            <span>プロフィール</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <button onClick={() => router.push("/billing")} className="w-full flex items-center justify-between py-3 px-1 text-[15px] hover:bg-[var(--hover-bg)] rounded-lg transition-colors">
            <span>料金明細</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <button onClick={() => router.push("/charge")} className="w-full flex items-center justify-between py-3 px-1 text-[15px] hover:bg-[var(--hover-bg)] rounded-lg transition-colors">
            <span>チャージ</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <button onClick={() => router.push("/integrations")} className="w-full flex items-center justify-between py-3 px-1 text-[15px] hover:bg-[var(--hover-bg)] rounded-lg transition-colors">
            <span>アプリ連携</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <button onClick={() => router.push("/help")} className="w-full flex items-center justify-between py-3 px-1 text-[15px] hover:bg-[var(--hover-bg)] rounded-lg transition-colors">
            <span>ヘルプ</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <button onClick={() => router.push("/contact")} className="w-full flex items-center justify-between py-3 px-1 text-[15px] hover:bg-[var(--hover-bg)] rounded-lg transition-colors">
            <span>お問い合わせ</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
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

      {/* Churn Survey Modal */}
      {showDeleteSurvey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--background)] rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-[16px] font-bold mb-2">退会前にひとつだけ教えてください</h3>
            <p className="text-[13px] text-[var(--muted)] mb-4">今後の改善に活用させていただきます。</p>

            <p className="text-[13px] font-bold mb-2">使わなくなった理由は？</p>
            <div className="space-y-2 mb-4">
              {[
                "使い方がわからなかった",
                "期待した機能がなかった",
                "料金が合わなかった",
                "他のサービスに乗り換えた",
                "そもそも必要なくなった",
                "その他",
              ].map((reason) => (
                <label key={reason} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <input
                    type="radio"
                    name="deleteReason"
                    value={reason}
                    checked={deleteReason === reason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="accent-[var(--accent)]"
                  />
                  {reason}
                </label>
              ))}
            </div>

            <p className="text-[13px] font-bold mb-2">ご意見があればお聞かせください（任意）</p>
            <textarea
              value={deleteComment}
              onChange={(e) => setDeleteComment(e.target.value)}
              placeholder="改善できることがあれば..."
              rows={3}
              className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)] mb-4 resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteSurvey(false); setDeleteReason(""); setDeleteComment(""); }}
                className="flex-1 py-2.5 border border-[var(--card-border)] rounded-xl text-sm font-bold hover:bg-[var(--hover-bg)]"
              >
                キャンセル
              </button>
              <button
                onClick={executeDelete}
                disabled={loading}
                className="flex-1 py-2.5 bg-[var(--danger)] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "処理中..." : "退会する"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-20" />
    </>
  );
}
