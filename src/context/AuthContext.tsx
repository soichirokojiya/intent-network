"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  displayName: string;
  avatarUrl: string;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; isExisting?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
  updateAvatarUrl: (url: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // Bind device_id to user ID (ensures data persists across browsers/sessions)
  const bindDeviceId = useCallback(async (userId: string) => {
    if (typeof window === "undefined") return;
    const currentDeviceId = localStorage.getItem("musu_device_id");

    if (currentDeviceId && currentDeviceId !== userId) {
      // Migrate old data to user ID
      try {
        await fetch("/api/migrate-device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldDeviceId: currentDeviceId, newDeviceId: userId }),
        });
      } catch { /* ignore */ }
    }

    // Always set device_id to user ID
    localStorage.setItem("musu_device_id", userId);
  }, []);

  // Load profile from profiles table
  const loadProfile = useCallback(async (userId: string, email: string) => {
    await bindDeviceId(userId);
    const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", userId).single();
    setDisplayName(data?.display_name || email.split("@")[0]);
    setAvatarUrl(data?.avatar_url || "");
  }, [bindDeviceId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user.email || "");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user.email || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: "このメールアドレスは既に登録されています。", isExisting: true };
    }
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDisplayName("");
    setAvatarUrl("");
  }, []);

  const updateDisplayName = useCallback(async (name: string) => {
    if (!user) return { error: "Not logged in" };
    const { error } = await supabase.from("profiles").update({
      display_name: name,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (!error) setDisplayName(name);
    return { error: error?.message || null };
  }, [user]);

  const updateAvatarUrl = useCallback(async (url: string) => {
    if (!user) return { error: "Not logged in" };
    const { error } = await supabase.from("profiles").update({
      avatar_url: url,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (!error) setAvatarUrl(url);
    return { error: error?.message || null };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, displayName, avatarUrl, loading, signUp, signIn, signOut, updateDisplayName, updateAvatarUrl }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
