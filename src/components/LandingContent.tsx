"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";

export function LandingContent() {
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const { t } = useLocale();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    fetch("/api/signup-check").then(r => r.json()).then(d => setSignupEnabled(d.signupEnabled)).catch(() => setSignupEnabled(true));
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
              <span className="text-3xl font-extrabold tracking-tight text-gray-900">musu <span className="font-normal text-lg opacity-60">β</span></span>
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
              <Link href="/media" className="text-[14px] text-[#4A99E9] font-bold hover:underline">
                musu lab（活用事例）→
              </Link>
            </div>
          </div>

          {/* Right: Auth form or closed notice */}
          <div className="w-full max-w-[396px]">
            <div className="bg-white rounded-xl shadow-lg p-6 pb-5">
              {!signupEnabled && !showLoginForm ? (
                <div className="text-center py-4">
                  <p className="text-[18px] font-bold text-gray-800 mb-2">β版の登録枠が上限に達しました</p>
                  <p className="text-[14px] text-gray-500 mb-4 leading-relaxed">
                    たくさんのご登録ありがとうございます。<br />
                    現在、新規登録を一時停止しています。<br />
                    次回の募集開始はXでお知らせします。
                  </p>
                  <a
                    href="https://x.com/OtobeAsako"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-full text-[14px] hover:bg-gray-800 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Xをフォローする
                  </a>
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-[12px] text-gray-400 mb-2">既にアカウントをお持ちの方</p>
                    <button
                      type="button"
                      onClick={() => setShowLoginForm(true)}
                      className="text-[14px] text-[#4A99E9] font-bold hover:underline"
                    >
                      ログインはこちら
                    </button>
                  </div>
                </div>
              ) : (
              <>
              {!isReset && (
                <>
                  <button
                    type="button"
                    onClick={() => signInWithGoogle()}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 font-medium py-3 rounded-lg transition-colors mb-3"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Googleでログイン
                  </button>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[12px] text-gray-400">または</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                </>
              )}
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
                    {mode === "reset" ? (
                      <button
                        onClick={() => switchMode("signin")}
                        className="bg-[#42b72a] hover:bg-[#36a420] text-white font-bold px-6 py-3 rounded-lg text-[15px] transition-colors"
                      >
                        {t("auth.backToSignIn")}
                      </button>
                    ) : signupEnabled ? (
                      <button
                        onClick={() => switchMode("signup")}
                        className="bg-[#42b72a] hover:bg-[#36a420] text-white font-bold px-6 py-3 rounded-lg text-[15px] transition-colors"
                      >
                        {t("auth.signUp")}
                      </button>
                    ) : null}
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
