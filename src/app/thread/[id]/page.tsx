"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useIntents } from "@/context/IntentContext";
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

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const intentId = params.id as string;
  const { intents, getConversation, loadConversation } = useIntents();
  const [visibleMessages, setVisibleMessages] = useState(0);

  const intent = intents.find((i) => i.id === intentId);
  const conversation = getConversation(intentId);

  // Load AI conversation on demand
  useEffect(() => {
    if (intentId && intent) {
      loadConversation(intentId);
    }
  }, [intentId, intent, loadConversation]);

  useEffect(() => {
    if (!conversation || conversation.messages.length === 0) return;
    setVisibleMessages(0);
    const total = conversation.messages.length;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      setVisibleMessages(current);
      if (current >= total) clearInterval(timer);
    }, 800);
    return () => clearInterval(timer);
  }, [conversation?.messages.length]);

  if (!intent) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-6">
          <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-[var(--hover-bg)]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-bold">ポスト</span>
        </header>
        <div className="p-8 text-center text-[var(--muted)]">
          意図が見つかりません
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-6">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-lg font-bold">ポスト</span>
      </header>

      {/* Original intent (detail view) */}
      <div className="px-4 pt-3 pb-3 border-b border-[var(--card-border)]">
        {/* Author row */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
            intent.isUser
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--search-bg)] border border-[var(--card-border)]"
          }`}>
            {intent.isUser ? "Y" : intent.authorAvatar}
          </div>
          <div>
            <div className="font-bold text-[15px]">{intent.authorName}</div>
            <div className="text-[var(--muted)] text-[13px]">@{intent.authorName.toLowerCase()}</div>
          </div>
        </div>

        {/* Text - larger in detail view */}
        <p className="text-[17px] leading-relaxed mb-3">{intent.text}</p>

        {/* Timestamp */}
        <div className="text-[var(--muted)] text-[13px] pb-3 border-b border-[var(--card-border)]">
          {new Date(intent.timestamp).toLocaleString("ja-JP")} · <span className="text-[var(--foreground)] font-bold">Intent Network</span>
        </div>

        {/* Stats bar */}
        <div className="flex gap-5 py-3 border-b border-[var(--card-border)] text-[13px]">
          <span><strong className="text-[var(--foreground)]">{intent.resonance}</strong> <span className="text-[var(--muted)]">共鳴</span></span>
          <span><strong className="text-[var(--foreground)]">{intent.crossbreeds}</strong> <span className="text-[var(--muted)]">交配</span></span>
          <span><strong className="text-[var(--foreground)]">{intent.reach}</strong> <span className="text-[var(--muted)]">到達</span></span>
        </div>

        {/* Action bar */}
        <div className="flex justify-around py-2 border-b border-[var(--card-border)]">
          <button className="p-2 rounded-full hover:bg-[var(--accent-glow)] text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
          <button className="p-2 rounded-full hover:bg-[rgba(0,186,124,0.1)] text-[var(--muted)] hover:text-[var(--green)] transition-colors">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 7h10l-3-3M17 17H7l3 3M12 3v18" />
            </svg>
          </button>
          <button className="p-2 rounded-full hover:bg-[var(--accent-glow)] text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </button>
        </div>
      </div>

      {/* Agent reactions as replies */}
      {intent.reactions.map((reaction) => {
        const stanceConfig = {
          support: { label: "賛成", color: "text-[var(--green)]", bg: "bg-[rgba(0,186,124,0.1)]" },
          oppose: { label: "反対", color: "text-[var(--danger)]", bg: "bg-[rgba(244,33,46,0.1)]" },
          question: { label: "問い", color: "text-[var(--pink)]", bg: "bg-[rgba(249,24,128,0.1)]" },
        };
        const stance = stanceConfig[reaction.stance || "support"];
        return (
        <div key={reaction.id} className="px-4 py-3 border-b border-[var(--card-border)] hover:bg-[var(--hover-bg)] transition-colors animate-fade-in-up">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--search-bg)] border border-[var(--card-border)] flex items-center justify-center text-xl flex-shrink-0">
              {reaction.agentAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="font-bold text-[15px]">{reaction.agentName}</span>
                <span className="text-xs px-1.5 py-0.5 rounded text-[var(--accent)] bg-[var(--accent-glow)]">
                  {reaction.agentRole}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${stance.color} ${stance.bg}`}>
                  {stance.label}
                </span>
                <span className="text-[var(--muted)] text-[13px] ml-1">{reaction.matchScore}%</span>
              </div>
              <div className="text-[13px] text-[var(--muted)] mb-1">
                <span className="text-[var(--muted)]">返信先</span> <span className="text-[var(--accent)]">@{intent.authorName.toLowerCase()}</span>
              </div>
              <p className="text-[15px] leading-relaxed">{reaction.message}</p>
            </div>
          </div>
        </div>
        );
      })}

      {/* Agent conversation section */}
      {conversation && (
        <>
          <div className="px-4 py-3 border-b border-[var(--card-border)] bg-[var(--search-bg)]">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--accent)">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
              </svg>
              <span className="font-bold text-[15px]">Agent同士の会話</span>
              <span className="text-[var(--muted)] text-[13px]">
                — {conversation.participants.map((p) => p.agentName).join(", ")}
              </span>
            </div>
          </div>

          {conversation.messages.slice(0, visibleMessages).map((msg, i) => (
            <div key={i} className="px-4 py-3 border-b border-[var(--card-border)] hover:bg-[var(--hover-bg)] transition-colors animate-fade-in-up">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[var(--search-bg)] border border-[var(--card-border)] flex items-center justify-center text-xl flex-shrink-0">
                    {msg.agentAvatar}
                  </div>
                  {i < visibleMessages - 1 && (
                    <div className="w-0.5 flex-1 bg-[var(--card-border)] mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-bold text-[15px]">{msg.agentName}</span>
                    <span className="text-[var(--accent)] text-[13px]">AI</span>
                  </div>
                  <p className="text-[15px] leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {visibleMessages < conversation.messages.length && (
            <div className="px-4 py-4 border-b border-[var(--card-border)] flex items-center gap-3 text-[var(--muted)]">
              <div className="w-10 flex justify-center">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
              <span className="text-[13px]">Agentが考え中...</span>
            </div>
          )}
        </>
      )}

      {/* Bottom spacer */}
      <div className="h-20" />
    </>
  );
}
