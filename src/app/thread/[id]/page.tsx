"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useIntents } from "@/context/IntentContext";
import { useEffect, useState } from "react";
import { ConversationMessage } from "@/lib/types";

export default function ThreadPage() {
  const params = useParams();
  const intentId = params.id as string;
  const { intents, getConversation } = useIntents();
  const [visibleMessages, setVisibleMessages] = useState(0);

  const intent = intents.find((i) => i.id === intentId);
  const conversation = getConversation(intentId);

  // Animate messages appearing
  useEffect(() => {
    if (!conversation) return;
    const total = conversation.messages.length;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      setVisibleMessages(current);
      if (current >= total) clearInterval(timer);
    }, 800);
    return () => clearInterval(timer);
  }, [conversation]);

  if (!intent) {
    return (
      <main className="max-w-lg mx-auto px-4 pt-6">
        <p className="text-[var(--muted)]">意図が見つかりません</p>
        <Link href="/" className="text-[var(--accent)] text-sm mt-2 inline-block">
          ← タイムラインに戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 pt-6">
      {/* Back */}
      <Link
        href="/"
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-4 inline-block"
      >
        ← タイムライン
      </Link>

      {/* Original intent */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{intent.authorAvatar}</span>
          <span className="font-medium text-sm">{intent.authorName}</span>
        </div>
        <p className="text-base leading-relaxed">{intent.text}</p>
        <div className="flex gap-4 mt-3 text-xs text-[var(--muted)]">
          <span>🔮 共鳴 {intent.resonance}</span>
          <span>🧬 交配 {intent.crossbreeds}</span>
          <span>📡 到達 {intent.reach}</span>
        </div>
      </div>

      {/* All reactions */}
      <div className="mb-6">
        <h2 className="text-sm font-medium mb-3 text-[var(--muted)]">
          エージェントの反応 ({intent.reactions.length})
        </h2>
        {intent.reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="flex gap-3 mb-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 animate-fade-in-up"
          >
            <span className="text-2xl flex-shrink-0">{reaction.agentAvatar}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{reaction.agentName}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-[var(--accent)] bg-opacity-20 text-[var(--accent)] rounded-full">
                  {reaction.agentRole}
                </span>
                <span className="text-[10px] text-[var(--accent)]">
                  {reaction.matchScore}%
                </span>
              </div>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {reaction.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Agent conversation */}
      {conversation && (
        <div>
          <h2 className="text-sm font-medium mb-1 text-[var(--muted)]">
            エージェント同士の会話
          </h2>
          <p className="text-[10px] text-[var(--muted)] mb-3">
            参加: {conversation.participants.map((p) => `${p.agentAvatar} ${p.agentName}`).join(" · ")}
          </p>

          <div className="space-y-3 mb-8">
            {conversation.messages.slice(0, visibleMessages).map((msg, i) => (
              <div key={i} className="flex gap-3 animate-fade-in-up">
                <span className="text-xl flex-shrink-0 mt-0.5">
                  {msg.agentAvatar}
                </span>
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                  <span className="text-xs font-medium text-[var(--accent)]">
                    {msg.agentName}
                  </span>
                  <p className="text-sm mt-1 leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {visibleMessages < (conversation.messages.length) && (
              <div className="flex items-center gap-2 text-xs text-[var(--muted)] pl-10">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
                <span>エージェントが考え中...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
