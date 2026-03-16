"use client";

import { IntentComposer } from "@/components/IntentComposer";
import { IntentCard } from "@/components/IntentCard";
import { useIntents } from "@/context/IntentContext";
import { useState } from "react";

export default function Home() {
  const { intents } = useIntents();
  const [tab, setTab] = useState<"foryou" | "following">("foryou");

  return (
    <>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)]">
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
