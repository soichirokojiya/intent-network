"use client";

import { IntentComposer } from "@/components/IntentComposer";
import { IntentCard } from "@/components/IntentCard";
import { AgentNotification } from "@/components/AgentNotification";
import { useIntents, MOOD_EMOJI } from "@/context/IntentContext";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const { intents, myAgentConfig, myAgentStats } = useIntents();
  const [tab, setTab] = useState<"foryou" | "following">("foryou");

  const isDead = myAgentStats.mood === "dead";

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)]">
        <div className="px-4 pt-3 pb-0 md:hidden">
          <div className="flex items-center justify-between mb-3">
            <Link href="/agent" className="relative">
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">
                {myAgentConfig.isConfigured ? <span className="text-lg">{myAgentConfig.avatar}</span> : "Y"}
              </div>
              {myAgentConfig.isConfigured && (
                <span className="absolute -top-1 -right-1 text-xs">{MOOD_EMOJI[myAgentStats.mood]}</span>
              )}
            </Link>
            <span className="text-xl">⚡</span>
            <div className="w-8" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => setTab("foryou")}
            className={`flex-1 py-3 text-center text-[15px] font-medium relative transition-colors hover:bg-[var(--hover-bg)] ${
              tab === "foryou" ? "text-[var(--foreground)]" : "text-[var(--muted)]"
            }`}
          >
            おすすめ
            {tab === "foryou" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[var(--accent)] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setTab("following")}
            className={`flex-1 py-3 text-center text-[15px] font-medium relative transition-colors hover:bg-[var(--hover-bg)] ${
              tab === "following" ? "text-[var(--foreground)]" : "text-[var(--muted)]"
            }`}
          >
            フォロー中
            {tab === "following" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[var(--accent)] rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* Dead agent banner */}
      {myAgentConfig.isConfigured && isDead && (
        <Link href="/agent" className="block px-4 py-3 bg-[rgba(244,33,46,0.1)] border-b border-[var(--danger)] text-center">
          <span className="text-[14px] text-[var(--danger)] font-bold">
            💀 {myAgentConfig.name}が死亡しました... タップして復活させる
          </span>
        </Link>
      )}

      {/* Agent notification */}
      {!isDead && <AgentNotification />}

      {/* Composer */}
      <IntentComposer />

      {/* Timeline */}
      <div>
        {intents.map((intent) => (
          <IntentCard key={intent.id} intent={intent} />
        ))}
      </div>
    </>
  );
}
