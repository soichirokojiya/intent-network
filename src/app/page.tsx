"use client";

import { IntentComposer } from "@/components/IntentComposer";
import { IntentCard } from "@/components/IntentCard";
import { useIntents } from "@/context/IntentContext";
import { LogoFull } from "@/components/Logo";

export default function Home() {
  const { intents } = useIntents();

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3">
        <LogoFull size={28} />
      </header>

      <IntentComposer />

      <div>
        {intents.map((intent) => (
          <IntentCard key={intent.id} intent={intent} />
        ))}
      </div>
    </>
  );
}
