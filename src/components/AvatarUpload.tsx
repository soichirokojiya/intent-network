"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
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

    // Validate
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) { alert("Max 2MB"); return; } // 2MB limit

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      console.error("Upload error:", error);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
    onAvatarChange(publicUrl);
    setUploading(false);
  };

  const isUrl = currentAvatar.startsWith("http");

  return (
    <div className="flex items-center gap-4">
      {/* Current avatar preview */}
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

      {/* Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 bg-[var(--search-bg)] border border-[var(--card-border)] rounded-xl text-[13px] font-bold hover:bg-[var(--hover-bg)] disabled:opacity-50 transition-colors"
      >
        Upload Photo
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
