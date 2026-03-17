"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogoFull } from "./Logo";

export function AuthScreen() {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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

    if (mode === "signup") {
      const { error } = await signUp(email, password);
      if (error) setError(error);
      else setSuccess("Check your email to confirm your account.");
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <LogoFull size={48} />
        </div>

        <h1 className="text-2xl font-extrabold text-center mb-2">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-[var(--muted)] text-center text-[14px] mb-6">
          {mode === "signin" ? "Sign in to manage your agents" : "Start raising your AI agents"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {error && (
            <p className="text-[var(--danger)] text-[13px] text-center">{error}</p>
          )}
          {success && (
            <p className="text-[var(--green)] text-[13px] text-center">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold py-3 rounded-full transition-colors"
          >
            {loading ? "..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center">
          {mode === "signin" ? (
            <p className="text-[14px] text-[var(--muted)]">
              Don&apos;t have an account?{" "}
              <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }} className="text-[var(--accent)] font-bold hover:underline">
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-[14px] text-[var(--muted)]">
              Already have an account?{" "}
              <button onClick={() => { setMode("signin"); setError(""); setSuccess(""); }} className="text-[var(--accent)] font-bold hover:underline">
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
