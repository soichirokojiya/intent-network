"use client";

import Link from "next/link";
import { Intent } from "@/lib/types";
import { useEffect, useState } from "react";

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分`;
  if (hours < 24) return `${hours}時間`;
  return `${Math.floor(hours / 24)}日`;
}

export function IntentCard({ intent }: { intent: Intent }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    setTick((t) => t + 1);
  }, [intent.reactions.length]);

  return (
    <Link href={`/thread/${intent.id}`} className="block">
      <article className="px-4 py-3 border-b border-[var(--card-border)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer animate-fade-in">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
              intent.isUser
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--search-bg)] border border-[var(--card-border)]"
            }`}>
              {intent.isUser ? "Y" : intent.authorAvatar}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-1 mb-0.5">
              <span className="font-bold text-[15px] truncate">{intent.authorName}</span>
              {intent.isUser && (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--accent)">
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.07 4.3l-3.18-3.18 1.06-1.06 2.12 2.12 4.24-4.24 1.06 1.06-5.3 5.3z" />
                </svg>
              )}
              <span className="text-[var(--muted)] text-[15px]">@{intent.authorName.toLowerCase()}</span>
              <span className="text-[var(--muted)] text-[15px]">·</span>
              <span className="text-[var(--muted)] text-[15px] hover:underline">{timeAgo(intent.timestamp)}</span>
            </div>

            {/* Text */}
            <p className="text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">{intent.text}</p>

            {/* My agent's reaction (highlighted) */}
            {intent.reactions.some((r) => r.agentId === "my-agent") && (
              <div className="bg-[var(--accent-glow)] rounded-2xl border border-[var(--accent)] p-3 mb-2 animate-fade-in">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-[var(--accent)]">あなたのAgentが発言</span>
                </div>
                <p className="text-[13px] leading-relaxed">
                  {intent.reactions.find((r) => r.agentId === "my-agent")!.message}
                </p>
              </div>
            )}

            {/* Other agent reactions preview */}
            {intent.reactions.filter((r) => r.agentId !== "my-agent").length > 0 && (
              <div className="bg-[var(--search-bg)] rounded-2xl border border-[var(--card-border)] p-3 mb-3 animate-fade-in">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex -space-x-1.5">
                    {intent.reactions.filter((r) => r.agentId !== "my-agent").slice(0, 3).map((r) => (
                      <span key={r.id} className="w-5 h-5 rounded-full bg-[var(--card-border)] flex items-center justify-center text-[10px] border border-[var(--background)]">
                        {r.agentAvatar}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-[var(--muted)]">
                    {intent.reactions.filter((r) => r.agentId !== "my-agent").length}体のAgentが反応
                  </span>
                </div>
                <p className="text-[13px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                  {(intent.reactions.find((r) => r.agentId !== "my-agent") || intent.reactions[0]).message}
                </p>
              </div>
            )}

            {/* Action bar - X style */}
            <div className="flex justify-between max-w-[400px] -ml-2">
              {/* Resonance (like reply) */}
              <button
                className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--accent)] group transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <div className="p-2 rounded-full group-hover:bg-[var(--accent-glow)] transition-colors">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <span className="text-[13px]">{intent.resonance || ""}</span>
              </button>

              {/* Crossbreed (like retweet) */}
              <button
                className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--green)] group transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <div className="p-2 rounded-full group-hover:bg-[rgba(0,186,124,0.1)] transition-colors">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M7 7h10l-3-3M17 17H7l3 3M12 3v18" />
                  </svg>
                </div>
                <span className="text-[13px]">{intent.crossbreeds || ""}</span>
              </button>

              {/* Reach (like views) */}
              <button
                className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--accent)] group transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <div className="p-2 rounded-full group-hover:bg-[var(--accent-glow)] transition-colors">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <span className="text-[13px]">{intent.reach || ""}</span>
              </button>

              {/* Share */}
              <button
                className="flex items-center text-[var(--muted)] hover:text-[var(--accent)] group transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <div className="p-2 rounded-full group-hover:bg-[var(--accent-glow)] transition-colors">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
