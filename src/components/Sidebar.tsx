"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useIntents, MOOD_EMOJI } from "@/context/IntentContext";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";
import { useState, useEffect } from "react";
import { loadRooms, createRoom, deleteRoom, renameRoom, type Room } from "@/lib/roomStorage";
import { useRouter } from "next/navigation";

function NavIcon({ type, active }: { type: string; active: boolean }) {
  if (type === "home") {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={active ? 2.5 : 1.5}>
        <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
      </svg>
    );
  }
  if (type === "contact") {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={active ? 2.5 : 1.5}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    );
  }
  if (type === "room") {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={active ? 2.5 : 1.5}>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--foreground)" strokeWidth={active ? 2.5 : 1.5}>
      <path d="M12 2a5 5 0 015 5v1a5 5 0 01-10 0V7a5 5 0 015-5zM20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { myAgents, activeAgent, myAgentConfig, myAgentStats } = useIntents();
  const { user, signOut } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState("");

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`「${roomName}」を削除しますか？チャット履歴も全て削除されます。`)) return;
    await deleteRoom(roomId);
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    if (currentRoomId === roomId) router.push("/");
  };

  const handleRenameRoom = async (roomId: string) => {
    if (!editRoomName.trim()) return;
    await renameRoom(roomId, editRoomName.trim());
    setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, name: editRoomName.trim() } : r));
    setEditingRoomId(null);
  };

  useEffect(() => {
    loadRooms().then(setRooms);
  }, []);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    const room = await createRoom(newRoomName.trim());
    setRooms((prev) => [...prev, room]);
    setNewRoomName("");
    setShowNewRoom(false);
  };

  const currentRoomId = searchParams.get("room");

  return (
    <aside className="hidden md:flex flex-col items-end w-[275px] pr-3 pt-8 sticky top-0 h-screen">
      <nav className="flex flex-col w-full max-w-[230px] gap-0.5 mt-4">
        {/* Project label */}
        <div className="px-3 pt-4 pb-1 flex items-center gap-2">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--muted)" strokeWidth="1.5">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <span className="text-[13px] text-[var(--muted)] font-bold">プロジェクト</span>
        </div>

        {/* Project Rooms */}
        {rooms.map((room) => {
          const isActive = pathname === "/" && currentRoomId === room.id;
          if (editingRoomId === room.id) {
            return (
              <div key={room.id} className="px-3 py-1.5">
                <input
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameRoom(room.id);
                    if (e.key === "Escape") setEditingRoomId(null);
                  }}
                  onBlur={() => handleRenameRoom(room.id)}
                  className="w-full bg-[var(--search-bg)] border border-[var(--accent)] rounded-lg px-3 py-2 text-[13px] outline-none"
                />
              </div>
            );
          }
          return (
            <div key={room.id} className="flex items-center group">
              <Link href={`/?room=${room.id}`}
                className="flex-1 flex items-center gap-4 px-3 py-2.5 rounded-full hover:bg-[var(--hover-bg)] transition-colors">
                <NavIcon type="room" active={isActive} />
                <span className={`text-[15px] truncate ${isActive ? "font-bold" : ""}`}>
                  {room.name}
                </span>
              </Link>
              <button
                onClick={() => { setEditingRoomId(room.id); setEditRoomName(room.name); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
                title="編集"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
              <button
                onClick={() => handleDeleteRoom(room.id, room.name)}
                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-[var(--danger)] transition-all"
                title="削除"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          );
        })}

        {/* Add room button */}
        {showNewRoom ? (
          <div className="px-3 py-2">
            <input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="プロジェクト名"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateRoom();
                if (e.key === "Escape") { setShowNewRoom(false); setNewRoomName(""); }
              }}
              className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
            />
          </div>
        ) : (
          <button onClick={() => setShowNewRoom(true)}
            className="flex items-center gap-4 px-3 py-2.5 rounded-full hover:bg-[var(--hover-bg)] transition-colors text-[var(--muted)]">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            <span className="text-[14px]">プロジェクト追加</span>
          </button>
        )}

        <Link href="/agent"
          className={`flex items-center gap-4 px-3 py-3 rounded-full hover:bg-[var(--hover-bg)] transition-colors mt-2`}>
          <NavIcon type="agent" active={pathname.startsWith("/agent")} />
          <span className={`text-xl ${pathname.startsWith("/agent") ? "font-bold" : ""}`}>
            {t("nav.myAgents")}
          </span>
        </Link>

        <Link href="/contact"
          className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-[var(--hover-bg)] transition-colors">
          <NavIcon type="contact" active={pathname.startsWith("/contact")} />
          <span className={`text-xl ${pathname.startsWith("/contact") ? "font-bold" : ""}`}>
            {t("nav.contact")}
          </span>
        </Link>
      </nav>

      {/* Language selector */}
      <div className="mt-4 w-full max-w-[230px]">
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="w-full bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm outline-none cursor-pointer"
        >
          {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="mt-auto" />

      {/* Profile → Settings */}
      <Link href="/settings" className="mb-3 flex items-center gap-3 p-3 rounded-full hover:bg-[var(--hover-bg)] transition-colors w-full max-w-[230px]">
        <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
          {user?.email?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{user?.email?.split("@")[0] || "User"}</div>
          <div className="text-xs text-[var(--muted)]">{t("settings.title")}</div>
        </div>
      </Link>
    </aside>
  );
}
