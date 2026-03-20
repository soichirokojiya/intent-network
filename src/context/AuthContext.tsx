"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  displayName: string;
  avatarUrl: string;
  businessInfo: string;
  memorySummary: string;
  newsEnabled: boolean;
  newsTime: string;
  googleCalendarConnected: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; isExisting?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
  updateAvatarUrl: (url: string) => Promise<{ error: string | null }>;
  updateBusinessInfo: (info: string) => Promise<{ error: string | null }>;
  updateNewsSettings: (enabled: boolean, time: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [businessInfo, setBusinessInfo] = useState("");
  const [memorySummary, setMemorySummary] = useState("");
  const [newsEnabled, setNewsEnabled] = useState(false);
  const [newsTime, setNewsTime] = useState("07:00");
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Bind device_id to user ID (ensures data persists across browsers/sessions)
  const bindDeviceId = useCallback((userId: string) => {
    if (typeof window === "undefined") return;
    const currentDeviceId = localStorage.getItem("musu_device_id");

    // Set device_id to user ID IMMEDIATELY (sync) before any data loading
    localStorage.setItem("musu_device_id", userId);

    // Migrate old data in background (fire and forget)
    if (currentDeviceId && currentDeviceId !== userId) {
      fetch("/api/migrate-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldDeviceId: currentDeviceId, newDeviceId: userId }),
      }).catch(() => {});
    }
  }, []);

  // Load profile from profiles table
  const loadProfile = useCallback(async (userId: string, email: string) => {
    bindDeviceId(userId);
    const { data } = await supabase.from("profiles").select("display_name, avatar_url, business_info, memory_summary, news_enabled, news_time, google_calendar_connected").eq("id", userId).single();
    setDisplayName(data?.display_name || email.split("@")[0]);
    setAvatarUrl(data?.avatar_url || "");
    setBusinessInfo(data?.business_info || "");
    setMemorySummary(data?.memory_summary || "");
    setNewsEnabled(data?.news_enabled ?? false);
    setNewsTime(data?.news_time || "07:00");
    setGoogleCalendarConnected(data?.google_calendar_connected ?? false);
    if (data?.business_info) localStorage.setItem("musu_business_info", data.business_info);
    if (data?.memory_summary) localStorage.setItem("musu_memory_summary", data.memory_summary);
  }, [bindDeviceId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Set device_id BEFORE setting user (which triggers IntentProvider)
        bindDeviceId(session.user.id);
        setUser(session.user);
        loadProfile(session.user.id, session.user.email || "");
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Password recovery: redirect to change password page
      if (event === "PASSWORD_RECOVERY" && session?.user) {
        window.location.href = "/settings/account";
        return;
      }
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
    setBusinessInfo("");
    setMemorySummary("");
    setNewsEnabled(false);
    setNewsTime("07:00");
    setGoogleCalendarConnected(false);
    // セキュリティ: 他のユーザーのデータにアクセスしないようdevice_idをクリア
    localStorage.removeItem("musu_device_id");
    localStorage.removeItem("musu_business_info");
    localStorage.removeItem("musu_memory_summary");
    localStorage.removeItem("musu_defaults_created");
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

  const updateBusinessInfo = useCallback(async (info: string) => {
    if (!user) return { error: "Not logged in" };
    const { error } = await supabase.from("profiles").update({
      business_info: info,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (!error) {
      setBusinessInfo(info);
      localStorage.setItem("musu_business_info", info);
    }
    return { error: error?.message || null };
  }, [user]);

  const updateNewsSettings = useCallback(async (enabled: boolean, time: string) => {
    if (!user) return { error: "Not logged in" };
    const { error } = await supabase.from("profiles").update({
      news_enabled: enabled,
      news_time: time,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (!error) {
      setNewsEnabled(enabled);
      setNewsTime(time);
    }
    return { error: error?.message || null };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, displayName, avatarUrl, businessInfo, memorySummary, newsEnabled, newsTime, googleCalendarConnected, loading, signUp, signIn, signOut, updateDisplayName, updateAvatarUrl, updateBusinessInfo, updateNewsSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
