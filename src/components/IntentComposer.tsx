"use client";

import { useState } from "react";
import { useIntents } from "@/context/IntentContext";

export function IntentComposer() {
  const [text, setText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const { postIntent } = useIntents();

  const handleSubmit = () => {
    if (!text.trim()) return;
    postIntent(text.trim());
    setText("");
    setIsExpanded(false);
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 mb-4">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-left text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          💭 あなたの意図を放流する...
        </button>
      ) : (
        <div className="animate-fade-in-up">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="やりたいこと、探していること、実現したい未来を書いてください..."
            className="w-full bg-transparent border-none outline-none resize-none text-[var(--foreground)] placeholder:text-[var(--muted)] text-base leading-relaxed"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--card-border)]">
            <span className="text-xs text-[var(--muted)]">
              ⌘+Enter で送信
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { setIsExpanded(false); setText(""); }}
                className="px-4 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="px-5 py-1.5 text-sm bg-[var(--accent)] text-white rounded-full disabled:opacity-30 hover:brightness-110 transition-all"
              >
                放流する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
