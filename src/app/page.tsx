"use client";

import { IntentComposer } from "@/components/IntentComposer";
import { LogoFull } from "@/components/Logo";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3">
        <LogoFull size={36} />
      </header>

      <IntentComposer />
    </div>
  );
}
