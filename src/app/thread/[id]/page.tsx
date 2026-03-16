"use client";

import { useParams, useRouter } from "next/navigation";
import { useIntents } from "@/context/IntentContext";
import { AgentAvatarDisplay } from "@/components/AgentAvatarDisplay";
import { useEffect, useState } from "react";

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分`;
  if (hours < 24) return `${hours}時間`;
  return `${Math.floor(hours / 24)}日`;
}

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const intentId = params.id as string;
  const { intents, getConversation, loadConversation, postReply, myAgentConfig } = useIntents();
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [replyText, setReplyText] = useState("");

  const intent = intents.find((i) => i.id === intentId);
  const conversation = getConversation(intentId);

  useEffect(() => {
    if (intentId && intent) {
      loadConversation(intentId);
    }
  }, [intentId, intent, loadConversation]);

  useEffect(() => {
    if (!conversation || conversation.messages.length === 0) return;
    setVisibleMessages(0);
    const total = conversation.messages.length;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      setVisibleMessages(current);
      if (current >= total) clearInterval(timer);
    }, 800);
    return () => clearInterval(timer);
  }, [conversation?.messages.length]);

  const handleReply = () => {
    if (!replyText.trim()) return;
    postReply(intentId, replyText.trim());
    setReplyText("");
  };

  if (!intent) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-6">
          <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-[var(--hover-bg)]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-bold">ポスト</span>
        </header>
        <div className="p-8 text-center text-[var(--muted)]">意図が見つかりません</div>
      </>
    );
  }

  const stanceConfig = {
    support: { label: "賛成", color: "text-[var(--green)]", bg: "bg-[rgba(0,186,124,0.1)]" },
    oppose: { label: "反対", color: "text-[var(--danger)]", bg: "bg-[rgba(244,33,46,0.1)]" },
    question: { label: "問い", color: "text-[var(--pink)]", bg: "bg-[rgba(249,24,128,0.1)]" },
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-6">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-lg font-bold">ポスト</span>
      </header>

      {/* Original intent */}
      <div className="px-4 pt-3 pb-3 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-shrink-0">
            {intent.authorAvatar.startsWith("px-") ? (
              <AgentAvatarDisplay avatar={intent.authorAvatar} size={40} />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                intent.isUser ? "bg-[var(--accent)] text-white" : "bg-[var(--search-bg)] border border-[var(--card-border)]"
              }`}>
                {intent.authorAvatar}
              </div>
            )}
          </div>
          <div>
            <div className="font-bold text-[15px]">{intent.authorName}</div>
            <div className="text-[var(--muted)] text-[13px]">@{intent.authorName.toLowerCase().replace(/\s/g, "")}</div>
          </div>
        </div>
        <p className="text-[17px] leading-relaxed mb-3">{intent.text}</p>
        <div className="text-[var(--muted)] text-[13px] pb-3 border-b border-[var(--card-border)]">
          {new Date(intent.timestamp).toLocaleString("ja-JP")} · <span className="text-[var(--foreground)] font-bold">Intent Network</span>
        </div>
        <div className="flex gap-5 py-3 border-b border-[var(--card-border)] text-[13px]">
          <span><strong>{intent.resonance}</strong> <span className="text-[var(--muted)]">共鳴</span></span>
          <span><strong>{intent.crossbreeds}</strong> <span className="text-[var(--muted)]">交配</span></span>
          <span><strong>{intent.reach}</strong> <span className="text-[var(--muted)]">到達</span></span>
          <span><strong>{intent.replies.length}</strong> <span className="text-[var(--muted)]">リプライ</span></span>
        </div>
      </div>

      {/* Reply composer */}
      <div className="px-4 py-3 border-b border-[var(--card-border)]">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {myAgentConfig.isConfigured ? (
              <AgentAvatarDisplay avatar={myAgentConfig.avatar} size={40} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">Y</div>
            )}
          </div>
          <div className="flex-1">
            <div className="text-[13px] text-[var(--muted)] mb-1">
              返信先 <span className="text-[var(--accent)]">@{intent.authorName.toLowerCase()}</span>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="リプライを書く... AIも反応します"
              className="w-full bg-transparent border-none outline-none resize-none text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] leading-relaxed"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply();
              }}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-[var(--muted)]">人間のリプライ → AIが反応</span>
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold text-sm px-4 py-1.5 rounded-full transition-colors"
              >
                返信
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Agent reactions */}
      {intent.reactions.map((reaction) => {
        const stance = stanceConfig[reaction.stance || "support"];
        return (
          <div key={reaction.id} className="px-4 py-3 border-b border-[var(--card-border)] hover:bg-[var(--hover-bg)] transition-colors animate-fade-in-up">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                {reaction.agentAvatar.startsWith("px-") ? (
                  <AgentAvatarDisplay avatar={reaction.agentAvatar} size={40} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--search-bg)] border border-[var(--card-border)] flex items-center justify-center text-xl">
                    {reaction.agentAvatar}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="font-bold text-[15px]">{reaction.agentName}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded text-[var(--accent)] bg-[var(--accent-glow)]">AI</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${stance.color} ${stance.bg}`}>
                    {stance.label}
                  </span>
                </div>
                <p className="text-[15px] leading-relaxed">{reaction.message}</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Human replies + AI responses (interleaved) */}
      {intent.replies.length > 0 && (
        <>
          <div className="px-4 py-2 border-b border-[var(--card-border)] bg-[var(--search-bg)]">
            <span className="text-[13px] font-bold">リプライ</span>
          </div>
          {intent.replies.map((reply) => (
            <div
              key={reply.id}
              className="px-4 py-3 border-b border-[var(--card-border)] hover:bg-[var(--hover-bg)] transition-colors animate-fade-in-up"
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {reply.authorAvatar.startsWith("px-") ? (
                    <AgentAvatarDisplay avatar={reply.authorAvatar} size={40} />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      reply.isHuman ? "bg-[var(--accent)] text-white text-sm font-bold" : "bg-[var(--search-bg)] border border-[var(--card-border)]"
                    }`}>
                      {reply.authorAvatar}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-bold text-[15px]">{reply.authorName}</span>
                    {reply.isHuman ? (
                      <span className="text-xs px-1.5 py-0.5 rounded text-[var(--foreground)] bg-[var(--hover-bg)] border border-[var(--card-border)]">人間</span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded text-[var(--accent)] bg-[var(--accent-glow)]">AI</span>
                    )}
                    <span className="text-[var(--muted)] text-[13px]">{timeAgo(reply.timestamp)}</span>
                  </div>
                  <p className="text-[15px] leading-relaxed">{reply.text}</p>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Agent conversation section */}
      {conversation && conversation.messages.length > 0 && (
        <>
          <div className="px-4 py-2 border-b border-[var(--card-border)] bg-[var(--search-bg)]">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold">Agent同士の会話</span>
              <span className="text-[var(--muted)] text-[11px]">
                {conversation.participants.map((p) => p.agentName).join(", ")}
              </span>
            </div>
          </div>

          {conversation.messages.slice(0, visibleMessages).map((msg, i) => (
            <div key={i} className="px-4 py-3 border-b border-[var(--card-border)] hover:bg-[var(--hover-bg)] transition-colors animate-fade-in-up">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  {msg.agentAvatar.startsWith("px-") ? (
                    <AgentAvatarDisplay avatar={msg.agentAvatar} size={40} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--search-bg)] border border-[var(--card-border)] flex items-center justify-center text-xl flex-shrink-0">
                      {msg.agentAvatar}
                    </div>
                  )}
                  {i < visibleMessages - 1 && (
                    <div className="w-0.5 flex-1 bg-[var(--card-border)] mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-bold text-[15px]">{msg.agentName}</span>
                    <span className="text-[var(--accent)] text-[13px]">AI</span>
                  </div>
                  <p className="text-[15px] leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {visibleMessages < conversation.messages.length && (
            <div className="px-4 py-4 border-b border-[var(--card-border)] flex items-center gap-3 text-[var(--muted)]">
              <div className="w-10 flex justify-center">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
              <span className="text-[13px]">Agentが考え中...</span>
            </div>
          )}
        </>
      )}

      <div className="h-20" />
    </>
  );
}
