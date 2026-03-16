"use client";

import { useState } from "react";
import { useIntents } from "@/context/IntentContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";

export function IntentComposer() {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { postIntent, myAgentConfig } = useIntents();

  const isConfigured = myAgentConfig.isConfigured;
  const avatarSeed = isConfigured ? myAgentConfig.avatar : "";
  const agentName = isConfigured ? myAgentConfig.name : "You";

  const handleSubmit = () => {
    if (!text.trim()) return;
    postIntent(text.trim());
    setText("");
    setIsFocused(false);
  };

  return (
    <div className="px-4 py-3 border-b border-[var(--card-border)]">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isConfigured ? (
            <AgentAvatarDisplay avatar={avatarSeed} size={40} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">
              Y
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-1 min-w-0">
          {isConfigured && isFocused && (
            <div className="text-[12px] text-[var(--muted)] mb-1">
              {agentName}として放流
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={isConfigured ? `${agentName}の意図を放流する...` : "どんな意図を放流する？"}
            className="w-full bg-transparent border-none outline-none resize-none text-xl text-[var(--foreground)] placeholder:text-[var(--muted)] leading-relaxed pt-2"
            rows={isFocused ? 3 : 1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />

          {/* Bottom bar */}
          {isFocused && (
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-[var(--card-border)] animate-fade-in">
              <div className="flex gap-1">
                <button className="p-2 rounded-full hover:bg-[var(--accent-glow)] transition-colors" title="カテゴリ">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--accent)">
                    <path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13z" />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:hover:bg-[var(--accent)] text-white font-bold text-sm px-5 py-2 rounded-full transition-colors"
              >
                放流する
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
