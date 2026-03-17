"use client";

import { PixelAvatar } from "./PixelAvatar";

export function AgentAvatarDisplay({
  avatar,
  size = 40,
  className = "",
}: {
  avatar: string;
  size?: number;
  className?: string;
}) {
  // URL (uploaded photo)
  if (avatar.startsWith("http")) {
    return (
      <img
        src={avatar}
        alt="avatar"
        className={className}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }

  // Pixel avatar
  if (avatar.startsWith("px-")) {
    return <PixelAvatar seed={avatar} size={size} className={className} />;
  }

  // Emoji fallback
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
