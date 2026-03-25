"use client";

import { useIntents, MOOD_EMOJI } from "@/context/IntentContext";
import { useLocale } from "@/context/LocaleContext";
import { translateRole } from "@/lib/i18n";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";

function getStoredOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("musu_agent_order") || "[]");
  } catch { return []; }
}

function saveOrder(ids: string[]) {
  localStorage.setItem("musu_agent_order", JSON.stringify(ids));
}

export function RightPanel() {
  const { intents, myAgents, removeAgent, activeAgentIds, toggleActiveAgent } = useIntents();
  const { locale, t } = useLocale();

  const [orderedAgents, setOrderedAgents] = useState(myAgents);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // Sort agents by stored order
  useEffect(() => {
    const storedOrder = getStoredOrder();
    if (storedOrder.length === 0) {
      setOrderedAgents(myAgents);
      return;
    }
    const sorted = [...myAgents].sort((a, b) => {
      const ai = storedOrder.indexOf(a.id);
      const bi = storedOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    setOrderedAgents(sorted);
  }, [myAgents]);

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const newOrder = [...orderedAgents];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    setOrderedAgents(newOrder);
    saveOrder(newOrder.map((a) => a.id));
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  // Touch drag support
  const touchStartY = useRef(0);
  const touchStartIdx = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartIdx.current = idx;
  };

  const handleTouchEnd = (e: React.TouchEvent, idx: number) => {
    if (touchStartIdx.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const slots = Math.round(dy / 50); // ~50px per row
    if (slots === 0) { touchStartIdx.current = null; return; }
    const newIdx = Math.max(0, Math.min(orderedAgents.length - 1, touchStartIdx.current + slots));
    if (newIdx !== touchStartIdx.current) {
      const newOrder = [...orderedAgents];
      const [moved] = newOrder.splice(touchStartIdx.current, 1);
      newOrder.splice(newIdx, 0, moved);
      setOrderedAgents(newOrder);
      saveOrder(newOrder.map((a) => a.id));
    }
    touchStartIdx.current = null;
    setOverIdx(null);
  };

  return (
    <aside className="hidden lg:block w-[350px] pl-6 pr-4 pt-3 sticky top-0 h-screen overflow-y-auto">
      {/* Search */}
      <div className="mb-4">
        <div className="bg-[var(--search-bg)] rounded-full flex items-center px-4 py-2.5 group focus-within:bg-transparent focus-within:ring-1 focus-within:ring-[var(--accent)]">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--muted)" strokeWidth="2" className="mr-3 group-focus-within:stroke-[var(--accent)]">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder={t("right.search")}
            className="bg-transparent border-none outline-none text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] w-full" />
        </div>
      </div>

      {/* My Agents */}
      {orderedAgents.length > 0 && (
        <div className="bg-[var(--search-bg)] rounded-2xl p-4 mb-4">
          <h2 className="text-xl font-extrabold mb-3">{t("right.myAgents")}</h2>
          {orderedAgents.map((agent, idx) => (
            <div
              key={agent.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, idx)}
              onTouchEnd={(e) => handleTouchEnd(e, idx)}
              className={`flex items-center gap-3 py-2.5 border-b border-[var(--card-border)] last:border-b-0 hover:bg-[var(--hover-bg)] -mx-2 px-2 rounded-lg transition-all group cursor-grab active:cursor-grabbing ${
                dragIdx === idx ? "opacity-30" : ""
              } ${overIdx === idx && dragIdx !== idx ? "border-t-2 border-t-[var(--accent)]" : ""}`}
            >
              {/* Drag handle */}
              <div className="flex-shrink-0 text-[var(--muted)] opacity-0 group-hover:opacity-50 cursor-grab">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <circle cx="8" cy="6" r="1.5" /><circle cx="16" cy="6" r="1.5" />
                  <circle cx="8" cy="12" r="1.5" /><circle cx="16" cy="12" r="1.5" />
                  <circle cx="8" cy="18" r="1.5" /><circle cx="16" cy="18" r="1.5" />
                </svg>
              </div>
              <button
                onClick={() => toggleActiveAgent(agent.id)}
                className={`w-8 h-5 rounded-full flex-shrink-0 transition-colors ${activeAgentIds.has(agent.id) ? "bg-[var(--accent)]" : "bg-[var(--card-border)]"}`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform mx-0.5 ${activeAgentIds.has(agent.id) ? "translate-x-3" : ""}`} />
              </button>
              <Link href={`/agent?id=${agent.id}`} className={`flex items-center gap-3 flex-1 min-w-0 ${!activeAgentIds.has(agent.id) ? "opacity-40" : ""}`}>
                <AgentAvatarDisplay avatar={agent.config.avatar} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{agent.config.name}</div>
                  {(agent.config.role || agent.config.expertise) && <div className="text-[11px] text-[var(--muted)] truncate">{translateRole(agent.config.role || agent.config.expertise, locale)}</div>}
                </div>
              </Link>
              {!agent.config.isOrchestrator && <button
                onClick={() => { if (confirm(t("agent.confirmDelete").replace("{name}", agent.config.name))) removeAgent(agent.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-[var(--danger)] transition-all flex-shrink-0"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>}
            </div>
          ))}
          <Link href="/agent?new=1" className="flex items-center justify-center gap-1.5 pt-3 mt-1 text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            <span className="text-[12px] font-bold">{t("agent.addAgent")}</span>
          </Link>
        </div>
      )}

      {/* Stats removed */}
    </aside>
  );
}
