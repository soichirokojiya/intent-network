"use client";

import { IntentComposer } from "@/components/IntentComposer";
import { IntentCard } from "@/components/IntentCard";
import { useIntents } from "@/context/IntentContext";

export default function Home() {
  const { intents } = useIntents();

  return (
    <main className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-[var(--accent)]">⚡</span>
          Intent Network
        </h1>
        <p className="text-xs text-[var(--muted)] mt-1">
          意図を放流する。AIが交配する。未来が生まれる。
        </p>
      </div>

      {/* Composer */}
      <IntentComposer />

      {/* Network pulse */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="relative">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ripple" />
        </div>
        <span className="text-xs text-[var(--muted)]">
          {12 + intents.length} 体のエージェントが活動中 · {intents.length} 件の意図が流れています
        </span>
      </div>

      {/* Timeline */}
      <div>
        {intents.map((intent) => (
          <IntentCard key={intent.id} intent={intent} />
        ))}
      </div>
    </main>
  );
}
