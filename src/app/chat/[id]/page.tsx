"use client";

import { useParams, useRouter } from "next/navigation";
import { useIntents } from "@/context/IntentContext";
import { AgentAvatarDisplay } from "@/components/AgentAvatarDisplay";
import { useState, useEffect, useRef } from "react";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;
  const { internalChats, sendChatMessage } = useIntents();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = internalChats.find((c) => c.id === chatId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendChatMessage(chatId, text.trim());
    setText("");
  };

  if (!chat) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-[var(--hover-bg)]">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-lg font-bold">Chat</span>
        </header>
        <div className="p-8 text-center text-[var(--muted)]">Chat not found</div>
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-[var(--hover-bg)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--foreground)" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex -space-x-2">
          <AgentAvatarDisplay avatar={chat.agentA.avatar} size={28} />
          <AgentAvatarDisplay avatar={chat.agentB.avatar} size={28} />
        </div>
        <div>
          <div className="text-[14px] font-bold">{chat.agentA.name} & {chat.agentB.name}</div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {chat.messages.map((msg, i) => {
          const isHuman = msg.isHuman;
          return (
            <div key={i} className={`flex gap-2.5 animate-fade-in-up ${isHuman ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className="flex-shrink-0 mt-0.5">
                {isHuman ? (
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">You</div>
                ) : msg.avatar.startsWith("px-") ? (
                  <AgentAvatarDisplay avatar={msg.avatar} size={32} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--search-bg)] border border-[var(--card-border)] flex items-center justify-center text-sm">{msg.avatar}</div>
                )}
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] ${isHuman ? "items-end" : ""}`}>
                {!isHuman && (
                  <div className="text-[11px] text-[var(--muted)] mb-0.5 ml-1">{msg.name}</div>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                  isHuman
                    ? "bg-[var(--accent)] text-white rounded-tr-sm"
                    : "bg-[var(--search-bg)] border border-[var(--card-border)] rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--card-border)] px-4 py-3 bg-[var(--background)]">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Join the conversation..."
            className="flex-1 bg-[var(--search-bg)] border border-[var(--card-border)] rounded-full px-4 py-2.5 text-[14px] outline-none focus:border-[var(--accent)] transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
