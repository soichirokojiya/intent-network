"use client";

import { useState } from "react";
import { useIntents } from "@/context/IntentContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";

export function IntentComposer() {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { postIntent, myAgents, activeAgent, setActiveAgentId } = useIntents();
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const configured = myAgents.filter((a) => a.config.isConfigured);
  const hasAgent = configured.length > 0 && activeAgent;

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
        <div className="flex-shrink-0 mt-0.5 relative">
          {hasAgent ? (
            <button onClick={() => configured.length > 1 && setShowAgentPicker(!showAgentPicker)}>
              <AgentAvatarDisplay avatar={activeAgent.config.avatar} size={40} />
              {configured.length > 1 && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--search-bg)] border border-[var(--card-border)] rounded-full flex items-center justify-center text-[8px] text-[var(--muted)]">
                  {configured.length}
                </span>
              )}
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">Y</div>
          )}

          {/* Agent picker dropdown */}
          {showAgentPicker && (
            <div className="absolute top-12 left-0 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl shadow-lg z-50 min-w-[200px] py-1 animate-fade-in">
              {configured.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => { setActiveAgentId(agent.id); setShowAgentPicker(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--hover-bg)] transition-colors ${
                    agent.id === activeAgent?.id ? "bg-[var(--hover-bg)]" : ""
                  }`}
                >
                  <AgentAvatarDisplay avatar={agent.config.avatar} size={32} />
                  <div className="text-left">
                    <div className="text-[13px] font-bold">{agent.config.name}</div>
                    <div className="text-[11px] text-[var(--muted)]">{agent.config.expertise || agent.config.tone || "Agent"}</div>
                  </div>
                  {agent.id === activeAgent?.id && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--accent)" className="ml-auto">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-1 min-w-0">
          {hasAgent && isFocused && (
            <div className="text-[12px] text-[var(--accent)] mb-1 flex items-center gap-1">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="var(--accent)">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              {activeAgent.config.name}に意図を伝える
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={hasAgent ? `${activeAgent.config.name}に意図を伝える...` : "意図を放流する..."}
            className="w-full bg-transparent border-none outline-none resize-none text-xl text-[var(--foreground)] placeholder:text-[var(--muted)] leading-relaxed pt-2"
            rows={isFocused ? 3 : 1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />

          {isFocused && (
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-[var(--card-border)] animate-fade-in">
              <div className="text-[11px] text-[var(--muted)]">
                {hasAgent ? `${activeAgent.config.name}があなたの言葉で発言します` : "Agent未設定"}
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
