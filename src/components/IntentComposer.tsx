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
      <div className="flex gap-3">
        {/* Avatar (clickable for agent picker) */}
        {/* No avatar display in composer */}

        {/* Input area */}
        <div className="flex-1 min-w-0">
          {hasAgent && isFocused && (
            <div className="text-[12px] text-[var(--accent)] mb-1 flex items-center gap-1">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="var(--accent)">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              {configured.map((a) => a.config.name).join("、")}に意図を伝える
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={hasAgent ? "Agentたちに意図を伝える..." : "意図を放流する..."}
            className="w-full bg-transparent border-none outline-none resize-none text-xl text-[var(--foreground)] placeholder:text-[var(--muted)] leading-relaxed pt-2"
            rows={isFocused ? 3 : 1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />

          {isFocused && (
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-[var(--card-border)] animate-fade-in">
              <div className="text-[11px] text-[var(--muted)]">
                {hasAgent ? `${configured.length}体のAgentがそれぞれの言葉で発言します` : "Agent未設定"}
              </div>
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
      </div>
    </div>
  );
}
