"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TrelloCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"saving" | "error">("saving");

  useEffect(() => {
    const hash = window.location.hash;
    const tokenMatch = hash.match(/token=([^&]+)/);

    if (!tokenMatch) {
      setStatus("error");
      return;
    }

    const token = tokenMatch[1];
    const deviceId = localStorage.getItem("musu_device_id") || "";

    if (!deviceId) {
      setStatus("error");
      return;
    }

    fetch("/api/trello/save-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, token }),
    })
      .then((res) => {
        if (res.ok) {
          router.replace("/integrations?trello=connected");
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        setStatus("error");
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        {status === "saving" ? (
          <>
            <div className="text-[var(--muted)] text-lg mb-2">Connecting Trello...</div>
            <div className="text-[var(--muted)] text-sm">Please wait</div>
          </>
        ) : (
          <>
            <div className="text-[var(--danger)] text-lg mb-2">Connection failed</div>
            <button
              onClick={() => router.replace("/integrations")}
              className="mt-4 px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm"
            >
              Back to Integrations
            </button>
          </>
        )}
      </div>
    </div>
  );
}
