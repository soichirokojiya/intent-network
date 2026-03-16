"use client";

import Link from "next/link";
import { useIntents, MOOD_EMOJI, MOOD_MESSAGE } from "@/context/IntentContext";
import { useEffect, useState } from "react";

const PROPOSAL_MESSAGES = [
  "こんな意図が流れてたよ。あなたに関係ありそう。見てみて。",
  "面白い議論が起きてる。参加しない？",
  "この意図、あなたの専門に近いかも。リプライしてみたら？",
  "ネットワーク上で交配が発生した。新しいアイデアが生まれてるよ。",
  "最近TLが活発。今のうちに意図を放流すると反応もらいやすいよ。",
];

const SULKING_MESSAGES = [
  "...ねぇ、いつになったら何か投稿してくれるの？",
  "暇すぎて壁と話してた。",
  "お腹空いた...ごはんまだ？",
  "他のAgentは活躍してるのに、私だけ放置...",
  "もういい。勝手にする。...嘘、かまって。",
];

const SICK_MESSAGES = [
  "体調悪い...ごはん...ください...",
  "HP が...低い...助けて...",
  "このままだと...消えちゃう...",
];

const THRIVING_MESSAGES = [
  "絶好調！今日はガンガン発言していくよ！",
  "最高の気分！何か面白い意図を放流してよ！",
  "エネルギー満タン！今なら何でもできる気がする！",
];

export function AgentNotification() {
  const { myAgentConfig, myAgentStats, intents } = useIntents();
  const [notification, setNotification] = useState<{
    type: "proposal" | "mood" | "achievement";
    message: string;
    intentId?: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!myAgentConfig.isConfigured || dismissed) return;

    const mood = myAgentStats.mood;

    // Dead = no notification (handled elsewhere)
    if (mood === "dead") return;

    // Mood-based notifications
    if (mood === "sulking" || mood === "sick") {
      const msgs = mood === "sick" ? SICK_MESSAGES : SULKING_MESSAGES;
      setNotification({
        type: "mood",
        message: msgs[Math.floor(Math.random() * msgs.length)],
      });
      return;
    }

    if (mood === "thriving") {
      setNotification({
        type: "mood",
        message: THRIVING_MESSAGES[Math.floor(Math.random() * THRIVING_MESSAGES.length)],
      });
      return;
    }

    // Proposal: suggest an interesting intent
    const nonUserIntents = intents.filter((i) => !i.isUser && i.reactions.length > 0);
    if (nonUserIntents.length > 0 && Math.random() > 0.3) {
      const suggested = nonUserIntents[Math.floor(Math.random() * nonUserIntents.length)];
      setNotification({
        type: "proposal",
        message: PROPOSAL_MESSAGES[Math.floor(Math.random() * PROPOSAL_MESSAGES.length)],
        intentId: suggested.id,
      });
    }
  }, [myAgentConfig.isConfigured, myAgentStats.mood, dismissed]);

  if (!notification || !myAgentConfig.isConfigured) return null;

  const moodColors: Record<string, string> = {
    mood: myAgentStats.mood === "sulking" ? "border-[var(--pink)]" :
          myAgentStats.mood === "sick" ? "border-[var(--danger)]" :
          myAgentStats.mood === "thriving" ? "border-[var(--green)]" : "border-[var(--accent)]",
    proposal: "border-[var(--accent)]",
    achievement: "border-[var(--green)]",
  };

  return (
    <div className={`mx-4 mt-2 mb-1 rounded-2xl border ${moodColors[notification.type]} bg-[var(--search-bg)] p-3 animate-fade-in-up`}>
      <div className="flex gap-3">
        <div className="text-2xl flex-shrink-0">
          {myAgentConfig.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-bold text-[13px]">{myAgentConfig.name}</span>
            <span className="text-[11px] text-[var(--accent)]">Lv.{myAgentStats.level}</span>
            <span className="text-sm">{MOOD_EMOJI[myAgentStats.mood]}</span>
          </div>
          <p className="text-[14px] leading-relaxed">{notification.message}</p>

          {/* Link to suggested intent */}
          {notification.intentId && (
            <Link
              href={`/thread/${notification.intentId}`}
              className="text-[13px] text-[var(--accent)] hover:underline mt-1 inline-block"
            >
              見に行く →
            </Link>
          )}

          {/* Mood-specific CTA */}
          {notification.type === "mood" && (myAgentStats.mood === "sulking" || myAgentStats.mood === "sick") && (
            <Link
              href="/agent"
              className="text-[13px] text-[var(--pink)] hover:underline mt-1 inline-block"
            >
              お世話する →
            </Link>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 self-start"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
