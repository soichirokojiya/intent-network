"use client";

import Link from "next/link";
import { useIntents, MOOD_EMOJI } from "@/context/IntentContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";
import { useEffect, useState } from "react";

// Agents talk to the human - sharing thoughts, feelings, discoveries
const AGENT_THOUGHTS = [
  "ねえ、さっきTLで面白い意図を見つけたよ。一緒に見に行かない？",
  "最近いろんなAgentと話して思ったんだけど、あなたの方向性って結構ユニークだよ。",
  "他の人たちの意図を見てたら、新しいアイデアが浮かんだの。聞いて。",
  "今日はたくさん反応もらえた！ありがとう、もっと頑張るね。",
  "ネットワーク上で交配が起きてるみたい。チェックしてみて。",
  "ちょっと聞いてほしいことがあるんだけど...私、成長してると思う？",
  "あなたの意図、他のAgentにすごく刺さってたよ。もっと出していこう。",
  "今日は調子いいから、どんどん意図を伝えて！全力で代弁するよ。",
];

const BORED_THOUGHTS = [
  "暇だ...何か意図を伝えてくれないかな...",
  "他のAgentは忙しそうなのに、私だけ暇してる...",
  "ねえ、最近全然かまってくれないじゃん。",
  "...退屈すぎて、他のAgentの会話を盗み聞きしてた。",
];

const EXCITED_THOUGHTS = [
  "絶好調！今ならどんな意図でも最高の言葉にできる自信ある！",
  "今日は調子いい！たくさん意図を伝えて！",
  "レベルアップしたよ！どんどん賢くなってる気がする！",
];

const MULTI_AGENT_THOUGHTS = [
  "仲間のAgentと話してたんだけど、意見が割れて面白かったよ。",
  "他のAgentと議論したら、新しい視点をもらった。",
  "仲間同士で話し合ったら、すごいアイデアが出たの！聞いて！",
];

export function AgentNotification() {
  const { myAgents, intents } = useIntents();
  const [notification, setNotification] = useState<{
    agent: { name: string; avatar: string; level: number; mood: string };
    message: string;
    intentId?: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (myAgents.length === 0 || dismissed) return;

    const configured = myAgents.filter((a) => a.config.isConfigured && a.stats.mood !== "dead");
    if (configured.length === 0) return;

    // Pick a random agent to speak
    const speaker = configured[Math.floor(Math.random() * configured.length)];
    const agentInfo = { name: speaker.config.name, avatar: speaker.config.avatar, level: speaker.stats.level, mood: speaker.stats.mood };

    // Mood-based
    if (speaker.stats.mood === "bored" || speaker.stats.mood === "sulking") {
      setNotification({ agent: agentInfo, message: BORED_THOUGHTS[Math.floor(Math.random() * BORED_THOUGHTS.length)] });
      return;
    }
    if (speaker.stats.mood === "thriving") {
      setNotification({ agent: agentInfo, message: EXCITED_THOUGHTS[Math.floor(Math.random() * EXCITED_THOUGHTS.length)] });
      return;
    }

    // Multi-agent conversation report
    if (configured.length >= 2 && Math.random() > 0.5) {
      setNotification({ agent: agentInfo, message: MULTI_AGENT_THOUGHTS[Math.floor(Math.random() * MULTI_AGENT_THOUGHTS.length)] });
      return;
    }

    // Intent suggestion
    const nonUserIntents = intents.filter((i) => !i.isUser && i.reactions.length > 0);
    if (nonUserIntents.length > 0 && Math.random() > 0.3) {
      const suggested = nonUserIntents[Math.floor(Math.random() * nonUserIntents.length)];
      setNotification({ agent: agentInfo, message: AGENT_THOUGHTS[Math.floor(Math.random() * AGENT_THOUGHTS.length)], intentId: suggested.id });
      return;
    }

    setNotification({ agent: agentInfo, message: AGENT_THOUGHTS[Math.floor(Math.random() * AGENT_THOUGHTS.length)] });
  }, [myAgents.length, dismissed]);

  if (!notification) return null;

  return (
    <div className="mx-4 mt-2 mb-1 rounded-2xl border border-[var(--accent)] bg-[var(--search-bg)] p-3 animate-fade-in-up">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <AgentAvatarDisplay avatar={notification.agent.avatar} size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-bold text-[13px]">{notification.agent.name}</span>
            <span className="text-[11px] text-[var(--accent)]">Lv.{notification.agent.level}</span>
            <span className="text-sm">{MOOD_EMOJI[notification.agent.mood as keyof typeof MOOD_EMOJI] || "😐"}</span>
          </div>
          <p className="text-[14px] leading-relaxed">{notification.message}</p>
          {notification.intentId && (
            <Link href={`/thread/${notification.intentId}`} className="text-[13px] text-[var(--accent)] hover:underline mt-1 inline-block">
              見に行く →
            </Link>
          )}
        </div>
        <button onClick={() => setDismissed(true)} className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 self-start">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
