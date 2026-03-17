"use client";

import { IntentComposer } from "@/components/IntentComposer";
import { LogoFull } from "@/components/Logo";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadRooms, type Room } from "@/lib/roomStorage";

export default function Home() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room") || "general";
  const [roomName, setRoomName] = useState<string | null>(null);

  useEffect(() => {
    if (roomId !== "general") {
      loadRooms().then((rooms) => {
        const room = rooms.find((r) => r.id === roomId);
        setRoomName(room?.name || null);
      });
    } else {
      setRoomName(null);
    }
  }, [roomId]);

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-40 bg-[var(--background)] bg-opacity-80 backdrop-blur-md border-b border-[var(--card-border)] px-4 py-3 flex items-center gap-3">
        {roomName ? (
          <span className="text-lg font-bold">{roomName}</span>
        ) : (
          <LogoFull size={36} />
        )}
      </header>

      <IntentComposer key={roomId} roomId={roomId} />
    </div>
  );
}
