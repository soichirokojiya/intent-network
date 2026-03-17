"use client";

import { useState } from "react";
import { useIntents } from "@/context/IntentContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";

export function IntentComposer() {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { postIntent, myAgents, agentResponses, clearAgentResponses } = useIntents();

  const configured = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead");
  const hasAgent = configured.length > 0;

  const handleSubmit = () => {
    if (!text.trim()) return;
    postIntent(text.trim());
    setText("");
  };

  return (
    <div className="border-b border-[var(--card-border)]">
      {/* Input */}
      <div className="px-4 py-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => { setIsFocused(true); clearAgentResponses(); }}
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

      {/* Agent responses to owner */}
      {agentResponses.length > 0 && (
        <div className="border-t border-[var(--card-border)] bg-[var(--search-bg)]">
          {agentResponses.map((resp) => (
            <div key={resp.agentId} className="px-4 py-3 border-b border-[var(--card-border)] animate-fade-in-up">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <AgentAvatarDisplay avatar={resp.agentAvatar} size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-bold text-[13px]">{resp.agentName}</span>
                    <span className="text-[11px] text-[var(--muted)]">→ あなたへ</span>
                  </div>
                  <p className="text-[14px] leading-relaxed">{resp.toOwner}</p>
                  <div className="flex gap-3 mt-1">
                    {resp.posted ? (
                      <span className="text-[11px] text-[var(--green)]">TL投稿済み</span>
                    ) : (
                      <span className="text-[11px] text-[var(--muted)]">投稿準備中...</span>
                    )}
                    {resp.tweeted && (
                      <span className="text-[11px] text-[var(--accent)]">Twitter投稿済み</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
