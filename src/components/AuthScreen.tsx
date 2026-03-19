"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";

import { LogoFull } from "./Logo";

export function AuthScreen({ defaultMode }: { defaultMode?: "signin" | "signup" | "reset" } = {}) {
  const { signUp, signIn } = useAuth();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(defaultMode || (searchParams.get("signup") ? "signup" : "signin"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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
      const { error } = await signIn(email, password);
      if (error) setError(t("auth.invalidCredentials"));
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
        <p className="text-[var(--muted)] text-center text-[14px] mb-6">
          {isReset ? t("auth.enterEmail") : isSignUp ? t("auth.freeStart") : t("auth.signInPlease")}
        </p>

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
