"use client";

import { PixelAvatar } from "./PixelAvatar";

// Renders either a pixel avatar (seed starts with "px-") or emoji avatar
export function AgentAvatarDisplay({
  avatar,
  size = 40,
  className = "",
}: {
  avatar: string;
  size?: number;
  className?: string;
}) {
  if (avatar.startsWith("px-")) {
    return <PixelAvatar seed={avatar} size={size} className={className} />;
  }

  // Emoji avatar fallback
  return (
    <span
      className={className}
      style={{
        fontSize: size * 0.55,
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {avatar}
    </span>
  );
}
