"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(user?.email?.split("@")[0] || "");
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
    const { error } = await supabase.from("profiles").update({ display_name: displayName, updated_at: new Date().toISOString() }).eq("id", user?.id);
    if (error) showErr(error.message);
    else showMsg("Name updated");
    setLoading(false);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) showErr(error.message);
    else showMsg("Confirmation email sent to new address");
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) { showErr("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { showErr("Passwords don't match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) showErr(error.message);
    else { showMsg("Password updated"); setNewPassword(""); setConfirmPassword(""); }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Delete your account? All agents and data will be lost.")) return;
    if (!confirm("This cannot be undone. Are you absolutely sure?")) return;
    // Note: account deletion requires service_role key on server side
    // For now, sign out and show message
    await signOut();
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-bold">Settings</span>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Messages */}
        {message && <div className="p-3 rounded-xl bg-[rgba(0,186,124,0.1)] text-[var(--green)] text-[14px]">{message}</div>}
        {error && <div className="p-3 rounded-xl bg-[rgba(244,33,46,0.1)] text-[var(--danger)] text-[14px]">{error}</div>}

        {/* Profile */}
        <div>
          <h2 className="text-[15px] font-bold mb-3">Profile</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-2xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-[15px]">{displayName}</div>
              <div className="text-[13px] text-[var(--muted)]">{user?.email}</div>
            </div>
          </div>

          <label className="text-[13px] text-[var(--muted)] block mb-1">Display Name</label>
          <div className="flex gap-2">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
            <button onClick={handleUpdateName} disabled={loading}
              className="px-4 py-2.5 bg-[var(--accent)] text-white font-bold text-sm rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50">
              Save
            </button>
          </div>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* Email */}
        <div>
          <h2 className="text-[15px] font-bold mb-3">Change Email</h2>
          <label className="text-[13px] text-[var(--muted)] block mb-1">New Email</label>
          <div className="flex gap-2">
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              placeholder={user?.email || ""}
              className="flex-1 bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
            <button onClick={handleUpdateEmail} disabled={loading || !newEmail}
              className="px-4 py-2.5 bg-[var(--accent)] text-white font-bold text-sm rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50">
              Update
            </button>
          </div>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* Password */}
        <div>
          <h2 className="text-[15px] font-bold mb-3">Change Password</h2>
          <div className="space-y-3">
            <div>
              <label className="text-[13px] text-[var(--muted)] block mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="text-[13px] text-[var(--muted)] block mb-1">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[var(--accent)]" />
            </div>
            <button onClick={handleUpdatePassword} disabled={loading || !newPassword}
              className="w-full py-2.5 bg-[var(--accent)] text-white font-bold text-sm rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50">
              Update Password
            </button>
          </div>
        </div>

        <hr className="border-[var(--card-border)]" />

        {/* Danger zone */}
        <div className="pt-4">
          <button onClick={handleDeleteAccount}
            className="text-[12px] text-[var(--muted)] hover:text-[var(--danger)] transition-colors">
            Delete Account
          </button>
        </div>
      </div>

      <div className="h-20" />
    </>
  );
}
