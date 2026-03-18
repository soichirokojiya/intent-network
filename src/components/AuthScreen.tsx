"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import { LogoFull } from "./Logo";

export function AuthScreen({ defaultMode }: { defaultMode?: "signin" | "signup" | "reset" } = {}) {
  const { signUp, signIn } = useAuth();
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
          setError(data.error || "送信に失敗しました");
        } else {
          setSuccess("パスワードリセットメールを送信しました。メールを確認してください。");
        }
      } catch {
        setError("送信に失敗しました");
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
          setError("このメールアドレスは既に登録されています。サインインしてください。");
          setMode("signin");
        } else if (!res.ok) {
          setError(data.error || "登録に失敗しました。");
        } else {
          setSuccess("確認メールを送信しました。メールのリンクをクリックしてください。");
        }
      } catch {
        setError("登録に失敗しました。");
      }
      setLoading(false);
      return;
    } else {
      const { error } = await signIn(email, password);
      if (error) setError("メールアドレスまたはパスワードが正しくありません。");
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
          {isReset ? "パスワードをリセット" : isSignUp ? "ひとりなのに、チームがいる。" : "おかえりなさい"}
        </h1>
        <p className="text-[var(--muted)] text-center text-[14px] mb-6">
          {isReset ? "登録済みのメールアドレスを入力してください" : isSignUp ? "無料ではじめる" : "サインインしてください"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレス"
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
                placeholder="パスワード（6文字以上）"
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
              アカウントを作成することにより、<a href="/terms" target="_blank" className="text-[var(--accent)] hover:underline">利用規約</a>と<a href="/privacy" target="_blank" className="text-[var(--accent)] hover:underline">プライバシーポリシー</a>に同意したことになります。
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
            {loading ? "..." : isReset ? "リセットメールを送信" : isSignUp ? "新規登録" : "サインイン"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === "signin" && (
            <>
              <p className="text-[14px] text-[var(--muted)]">
                はじめての方は{" "}
                <button onClick={() => switchMode("signup")} className="text-[var(--accent)] font-bold hover:underline">
                  新規登録
                </button>
              </p>
              <p>
                <button onClick={() => switchMode("reset")} className="text-[13px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  パスワードをお忘れの方はこちら
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-[14px] text-[var(--muted)]">
              アカウントをお持ちの方は{" "}
              <button onClick={() => switchMode("signin")} className="text-[var(--accent)] font-bold hover:underline">
                サインイン
              </button>
            </p>
          )}
          {mode === "reset" && (
            <p className="text-[14px] text-[var(--muted)]">
              <button onClick={() => switchMode("signin")} className="text-[var(--accent)] font-bold hover:underline">
                サインインに戻る
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
