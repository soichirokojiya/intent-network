"use client";

import Link from "next/link";
import { Intent } from "@/lib/types";
import { useState, useEffect } from "react";

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

export function IntentCard({ intent }: { intent: Intent }) {
  const [visibleReactions, setVisibleReactions] = useState(intent.reactions.length);

  useEffect(() => {
    setVisibleReactions(intent.reactions.length);
  }, [intent.reactions.length]);

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 mb-3 animate-fade-in-up hover:border-[var(--accent)] transition-colors">
      {/* Author */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{intent.authorAvatar}</span>
        <div>
          <span className="font-medium text-sm">{intent.authorName}</span>
          <span className="text-xs text-[var(--muted)] ml-2">
            {timeAgo(intent.timestamp)}
          </span>
        </div>
        {intent.isUser && (
          <span className="ml-auto text-xs bg-[var(--accent)] text-white px-2 py-0.5 rounded-full">
            あなた
          </span>
        )}
      </div>

      {/* Intent text */}
      <p className="text-base mb-4 leading-relaxed">{intent.text}</p>

      {/* Stats */}
      <div className="flex gap-4 mb-3 text-xs text-[var(--muted)]">
        <span>🔮 共鳴 {intent.resonance}</span>
        <span>🧬 交配 {intent.crossbreeds}</span>
        <span>📡 到達 {intent.reach}</span>
      </div>

      {/* Agent reactions */}
      {intent.reactions.length > 0 && (
        <div className="border-t border-[var(--card-border)] pt-3 mt-2">
          <div className="text-xs text-[var(--muted)] mb-2">
            エージェントの反応 ({intent.reactions.length})
          </div>
          {intent.reactions.slice(0, 2).map((reaction) => (
            <div
              key={reaction.id}
              className="flex gap-2 mb-2 last:mb-0 animate-fade-in-up"
            >
              <span className="text-lg flex-shrink-0">{reaction.agentAvatar}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{reaction.agentName}</span>
                  <span className="text-[10px] text-[var(--accent)]">
                    {reaction.matchScore}% match
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-0.5 line-clamp-2">
                  {reaction.message}
                </p>
              </div>
            </div>
          ))}
          {intent.reactions.length > 2 && (
            <Link
              href={`/thread/${intent.id}`}
              className="text-xs text-[var(--accent)] hover:underline mt-1 inline-block"
            >
              他 {intent.reactions.length - 2} 件の反応とエージェント会話を見る →
            </Link>
          )}
        </div>
      )}

      {/* Thread link */}
      {intent.reactions.length <= 2 && intent.reactions.length > 0 && (
        <Link
          href={`/thread/${intent.id}`}
          className="text-xs text-[var(--accent)] hover:underline mt-2 inline-block"
        >
          エージェント会話を見る →
        </Link>
      )}
    </div>
  );
}
