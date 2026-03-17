"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, signOut, displayName: savedName, updateDisplayName } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(savedName || user?.email?.split("@")[0] || "");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const showMsg = (msg: string) => { setMessage(msg); setError(""); setTimeout(() => setMessage(""), 3000); };
  const showErr = (msg: string) => { setError(msg); setMessage(""); };

  const handleUpdateName = async () => {
    setLoading(true);
    const { error } = await updateDisplayName(displayName);
    if (error) showErr(error);
    else showMsg("保存しました");
    setLoading(false);
  };

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
    if (!confirm("本当に解約しますか？すべてのデータが削除されます。")) return;
    if (!confirm("この操作は取り消せません。本当によろしいですか？")) return;
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
        showErr(data.error || "解約に失敗しました");
        setLoading(false);
        return;
      }
      localStorage.removeItem("musu_device_id");
      await signOut();
      window.location.href = "/?signup=1";
    } catch {
      showErr("解約に失敗しました");
      setLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-bold">{t("settings.title")}</span>
      </header>

      <div className="px-4 py-6 space-y-6">
        {message && <div className="p-3 rounded-xl bg-[rgba(0,186,124,0.1)] text-[var(--green)] text-[14px]">{message}</div>}
        {error && <div className="p-3 rounded-xl bg-[rgba(244,33,46,0.1)] text-[var(--danger)] text-[14px]">{error}</div>}

        {/* Profile */}
        <div>
          <h2 className="text-[15px] font-bold mb-3">{t("settings.profile")}</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-2xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-[15px]">{displayName}</div>
              <div className="text-[13px] text-[var(--muted)]">{user?.email}</div>
            </div>
          </div>

          <label className="text-[13px] text-[var(--muted)] block mb-1">{t("settings.displayName")}</label>
          <div className="flex gap-2">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
            <button onClick={handleUpdateName} disabled={loading}
              className="px-4 py-2.5 bg-[var(--accent)] text-white font-bold text-sm rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50">
              {t("settings.save")}
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

        {/* Sign out */}
        <div className="pt-2">
          <button onClick={signOut} className="w-full py-2.5 border border-[var(--card-border)] rounded-xl text-sm font-bold hover:bg-[var(--hover-bg)]">
            {t("settings.signOut")}
          </button>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* 解約 */}
        <div className="pt-2">
          <h2 className="text-[15px] font-bold mb-2 text-[var(--danger)]">解約</h2>
          <p className="text-[13px] text-[var(--muted)] mb-4">
            アカウントとすべてのエージェント・チャット履歴が完全に削除されます。この操作は取り消せません。同じメールアドレスで再登録は可能です。
          </p>
          <button onClick={handleDeleteAccount} disabled={loading}
            className="w-full py-2.5 border border-[var(--danger)] text-[var(--danger)] rounded-xl text-sm font-bold hover:bg-[rgba(244,33,46,0.1)] disabled:opacity-50 transition-colors">
            アカウントを削除する
          </button>
        </div>
      </div>
      <div className="h-20" />
    </>
  );
}
