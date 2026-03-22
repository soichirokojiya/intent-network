"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";

export function LandingContent() {
  const { signUp, signIn } = useAuth();
  const { t } = useLocale();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
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
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[980px] flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 lg:gap-20">

          {/* Left: Branding */}
          <div className="flex-1 text-center md:text-left md:pt-10 max-w-md">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <div className="w-12 h-12 bg-[#4A99E9] rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 40 40" width="28" height="28" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <path d="M12 28c0-8 4-14 8-14s8 6 8 14" />
                </svg>
              </div>
              <span className="text-3xl font-extrabold tracking-tight text-gray-900">musu</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold leading-snug text-gray-800 mb-3">
              ひとりだけど、<br />ひとりじゃない。
            </h1>
            <p className="text-lg text-gray-500 mb-1">
              育てるほど、任せられる。
            </p>
            <p className="text-lg text-gray-500">
              あなただけの仲間を持とう。
            </p>
            <div className="flex flex-col sm:flex-row items-center md:items-start gap-2 mt-4">
              <Link href="/about" className="text-[14px] text-[#4A99E9] font-bold hover:underline">
                musuについて詳しく見る →
              </Link>
              <Link href="/media" className="text-[14px] text-gray-500 font-bold hover:underline">
                活用事例を見る →
              </Link>
            </div>
          </div>

          {/* Right: Auth form */}
          <div className="w-full max-w-[396px]">
            <div className="bg-white rounded-xl shadow-lg p-6 pb-5">
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#4A99E9] transition-colors bg-white"
                />
                {!isReset && (
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
                    required
                    minLength={6}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-[15px] outline-none focus:border-[#4A99E9] transition-colors bg-white"
                  />
                )}

                {error && <p className="text-red-500 text-[13px] text-center">{error}</p>}
                {success && <p className="text-green-600 text-[13px] text-center">{success}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4A99E9] hover:bg-[#3a89d9] text-white font-bold py-3 rounded-lg text-[16px] transition-colors disabled:opacity-50"
                >
                  {loading ? "..." : isReset ? t("auth.sendResetEmail") : isSignUp ? t("auth.signUp") : t("auth.signIn")}
                </button>

                {mode === "signin" && (
                  <div className="text-center pt-1">
                    <button type="button" onClick={() => switchMode("reset")} className="text-[13px] text-[#4A99E9] hover:underline">
                      {t("auth.forgotPassword")}
                    </button>
                  </div>
                )}
              </form>

              {mode !== "signup" && (
                <>
                  <div className="border-t border-gray-200 my-5" />
                  <div className="text-center">
                    <button
                      onClick={() => switchMode(mode === "reset" ? "signin" : "signup")}
                      className="bg-[#42b72a] hover:bg-[#36a420] text-white font-bold px-6 py-3 rounded-lg text-[15px] transition-colors"
                    >
                      {mode === "reset" ? t("auth.backToSignIn") : t("auth.signUp")}
                    </button>
                  </div>
                </>
              )}

              {mode === "signup" && (
                <>
                  <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
                    {t("auth.agreeTerms")}<a href="/terms" target="_blank" className="text-[#4A99E9] hover:underline">{t("auth.terms")}</a>{t("auth.and")}<a href="/privacy" target="_blank" className="text-[#4A99E9] hover:underline">{t("auth.privacy")}</a>{t("auth.agreeEnd")}
                  </p>
                  <div className="text-center mt-4">
                    <button onClick={() => switchMode("signin")} className="text-[14px] text-[#4A99E9] hover:underline">
                      {t("auth.haveAccount")}{t("auth.signIn")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-6">
        <div className="max-w-[980px] mx-auto">
          {/* Language */}
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-gray-500 pb-3 border-b border-gray-200">
            <span className="text-gray-700">日本語</span>
            <a href="#" className="hover:underline">English</a>
            <a href="#" className="hover:underline">中文</a>
            <a href="#" className="hover:underline">한국어</a>
            <a href="#" className="hover:underline">Espanol</a>
            <a href="#" className="hover:underline">Portugues</a>
            <a href="#" className="hover:underline">Francais</a>
          </div>
          {/* Links */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500 py-3 border-b border-gray-200">
            <Link href="/terms" className="hover:underline">利用規約</Link>
            <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
            <Link href="/contact" className="hover:underline">お問い合わせ</Link>
            <Link href="/help" className="hover:underline">ヘルプ</Link>
            <a href="https://cfac.co.jp/" target="_blank" rel="noopener noreferrer" className="hover:underline">運営会社</a>
          </div>
          {/* Copyright */}
          <p className="text-[12px] text-gray-400 pt-3">&copy; 2026 musu.world</p>
        </div>
      </footer>
    </div>
  );
}
