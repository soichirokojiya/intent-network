"use client";

import { Intent } from "@/lib/types";
import { useEffect, useState } from "react";
import { useIntents } from "@/context/IntentContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function IntentCard({ intent }: { intent: Intent }) {
  const [, setTick] = useState(0);
  const { myAgents } = useIntents();

  useEffect(() => {
    setTick((t) => t + 1);
  }, [intent.reactions.length]);

  const myAgentIds = new Set(myAgents.map((a) => a.id));

  return (
    <div className="border-b border-[var(--card-border)]">
      {/* Main message */}
      <div className="px-4 py-3">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <AgentAvatarDisplay avatar={intent.authorAvatar} size={36} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bold text-[14px]">{intent.authorName}</span>
              <span className="text-[12px] text-[var(--muted)]">{timeAgo(intent.timestamp)}</span>
            </div>
            <p className="text-[15px] leading-relaxed">{intent.text}</p>
          </div>
        </div>
      </div>

      {/* Agent reactions as chat replies */}
      {intent.reactions.filter((r) => myAgentIds.has(r.agentId)).map((r) => (
        <div key={r.id} className="px-4 pb-3 animate-fade-in">
          <div className="ml-12 flex gap-2.5">
            <div className="flex-shrink-0 mt-0.5">
              <AgentAvatarDisplay avatar={r.agentAvatar} size={28} />
            </div>
            <div className="flex-1 min-w-0 bg-[var(--search-bg)] rounded-2xl rounded-tl-sm px-3.5 py-2.5">
              <span className="text-[12px] font-bold text-[var(--accent)]">{r.agentName}</span>
              <p className="text-[14px] leading-relaxed mt-0.5">{r.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
