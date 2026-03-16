"use client";

import { useState } from "react";
import { useIntents } from "@/context/IntentContext";

export function IntentComposer() {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { postIntent, myAgents } = useIntents();

  const configured = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead");
  const hasAgent = configured.length > 0;

  const handleSubmit = () => {
    if (!text.trim()) return;
    postIntent(text.trim());
    setText("");
    setIsFocused(false);
  };

  return (
    <div className="px-4 py-3 border-b border-[var(--card-border)]">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setIsFocused(true)}
        placeholder="意図を伝える..."
        className="w-full bg-transparent border-none outline-none resize-none text-xl text-[var(--foreground)] placeholder:text-[var(--muted)] leading-relaxed"
        rows={isFocused ? 3 : 1}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
        }}
      />
      {isFocused && (
        <div className="flex items-center justify-end mt-2 pt-3 border-t border-[var(--card-border)] animate-fade-in">
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || !hasAgent}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold text-sm px-5 py-2 rounded-full transition-colors"
          >
            伝える
          </button>
        </div>
      )}
    </div>
  );
}
