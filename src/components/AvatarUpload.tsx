"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { AgentAvatarDisplay } from "./AgentAvatarDisplay";

interface AvatarUploadProps {
  currentAvatar: string;
  onAvatarChange: (avatar: string) => void;
}

export function AvatarUpload({ currentAvatar, onAvatarChange }: AvatarUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) { alert("2MB以下の画像を選択してください"); return; }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.id);

    try {
      const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        onAvatarChange(data.url);
      } else {
        alert(data.error || "アップロードに失敗しました");
      }
    } catch {
      alert("アップロードに失敗しました");
    }

    setUploading(false);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isUrl = currentAvatar.startsWith("http");

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {isUrl ? (
          <img src={currentAvatar} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <AgentAvatarDisplay avatar={currentAvatar} size={64} />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">...</span>
          </div>
        )}
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl text-[13px] font-bold hover:bg-[var(--hover-bg)] disabled:opacity-50 transition-colors"
      >
        写真をアップロード
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
