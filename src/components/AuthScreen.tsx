"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";

import { LogoFull } from "./Logo";

export function AuthScreen({ defaultMode }: { defaultMode?: "signin" | "signup" | "reset" } = {}) {
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(defaultMode || (searchParams.get("signup") ? "signup" : "signin"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/signup-check").then(r => r.json()).then(d => setSignupEnabled(d.signupEnabled)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "reset") {
      try {
        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || t("auth.sendFailed"));
        } else {
          setSuccess(t("auth.resetEmailSent"));
        }
      } catch {
        setError(t("auth.sendFailed"));
      }
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.status === 409) {
          setError(t("auth.emailExists"));
          setMode("signin");
        } else if (!res.ok) {
          setError(data.error || t("auth.signupFailed"));
        } else {
          setSuccess(t("auth.confirmEmail"));
        }
      } catch {
        setError(t("auth.signupFailed"));
      }
      setLoading(false);
      return;
    } else {
      try {
        const { error } = await signIn(email, password);
        if (error) setError(t("auth.invalidCredentials"));
      } catch {
        setError(t("auth.invalidCredentials"));
      }
    }
    setLoading(false);
  };

  const switchMode = (newMode: "signin" | "signup" | "reset") => {
    setMode(newMode);
    setError("");
    setSuccess("");
  };

  const isSignUp = mode === "signup";
  const isReset = mode === "reset";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <LogoFull size={48} />
        </div>

        <h1 className="text-2xl font-extrabold text-center mb-1">
          {isReset ? t("auth.resetPassword") : isSignUp ? t("auth.teamTagline") : t("auth.welcome")}
        </h1>
        {!isReset && (
          <p className="text-[var(--muted)] text-center text-[13px] mb-1">
            育てるほど、任せられる。
          </p>
        )}
        <p className="text-[var(--muted)] text-center text-[14px] mb-6">
          {isReset ? t("auth.enterEmail") : isSignUp ? "あなただけの仲間を持とう。" : t("auth.signInPlease")}
        </p>

        {!isReset && (isSignUp ? signupEnabled : true) && (
          <>
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="w-full flex items-center justify-center gap-3 bg-[var(--search-bg)] hover:bg-[var(--hover-bg)] border border-[var(--card-border)] font-medium py-3 rounded-full transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Googleでログイン
            </button>
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-[var(--card-border)]" />
              <span className="text-[12px] text-[var(--muted)]">または</span>
              <div className="flex-1 h-px bg-[var(--card-border)]" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              required
              className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          {!isReset && (
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                required
                minLength={6}
                className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          )}

          {error && (
            <p className="text-[var(--danger)] text-[13px] text-center">{error}</p>
          )}
          {success && (
            <p className="text-[var(--green)] text-[13px] text-center">{success}</p>
          )}

          {isSignUp && (
            <p className="text-[11px] text-[var(--muted)] text-center leading-relaxed">
              {t("auth.agreeTerms")}<a href="/terms" target="_blank" className="text-[var(--accent)] hover:underline">{t("auth.terms")}</a>{t("auth.and")}<a href="/privacy" target="_blank" className="text-[var(--accent)] hover:underline">{t("auth.privacy")}</a>{t("auth.agreeEnd")}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-3 rounded-full transition-colors disabled:opacity-50 ${
              isSignUp
                ? "bg-[var(--foreground)] text-[var(--background)] hover:opacity-80"
                : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
            }`}
          >
            {loading ? "..." : isReset ? t("auth.sendResetEmail") : isSignUp ? t("auth.signUp") : t("auth.signIn")}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === "signin" && (
            <>
              <p className="text-[14px] text-[var(--muted)]">
                {t("auth.newHere")}
                <button onClick={() => switchMode("signup")} className="text-[var(--accent)] font-bold hover:underline">
                  {t("auth.signUp")}
                </button>
              </p>
              <p>
                <button onClick={() => switchMode("reset")} className="text-[13px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  {t("auth.forgotPassword")}
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-[14px] text-[var(--muted)]">
              {t("auth.haveAccount")}
              <button onClick={() => switchMode("signin")} className="text-[var(--accent)] font-bold hover:underline">
                {t("auth.signIn")}
              </button>
            </p>
          )}
          {mode === "reset" && (
            <p className="text-[14px] text-[var(--muted)]">
              <button onClick={() => switchMode("signin")} className="text-[var(--accent)] font-bold hover:underline">
                {t("auth.backToSignIn")}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
