"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, authFetch } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  displayName: string;
  avatarUrl: string;
  businessInfo: string;
  memorySummary: string;
  newsEnabled: boolean;
  newsTime: string;
  newsTimes: string[];
  googleCalendarConnected: boolean;
  trelloConnected: boolean;
  scheduleDeliveryEnabled: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; isExisting?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
  updateAvatarUrl: (url: string) => Promise<{ error: string | null }>;
  updateBusinessInfo: (info: string) => Promise<{ error: string | null }>;
  updateNewsSettings: (enabled: boolean, time: string, times?: string[]) => Promise<{ error: string | null }>;
  updateScheduleDelivery: (enabled: boolean) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
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
  const [newsTimes, setNewsTimes] = useState<string[]>(["07:00"]);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [trelloConnected, setTrelloConnected] = useState(false);
  const [scheduleDeliveryEnabled, setScheduleDeliveryEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Bind device_id to user ID (ensures data persists across browsers/sessions)
  const bindDeviceId = useCallback((userId: string) => {
    if (typeof window === "undefined") return;
    const currentDeviceId = localStorage.getItem("musu_device_id");

    // Clear all cached data when switching accounts
    if (currentDeviceId && currentDeviceId !== userId) {
      const keysToKeep = ["musu_auth_migrated"];
      const allKeys = Object.keys(localStorage).filter(
        (k) => !k.startsWith("sb-") && !keysToKeep.includes(k) && !k.startsWith("musu_welcome_done_"),
      );
      allKeys.forEach((k) => localStorage.removeItem(k));
      // Set welcome_done for the new user ID (existing user re-login should not see welcome)
      localStorage.setItem(`musu_welcome_done_${userId}`, "1");

      // Migrate old data in background (fire and forget)
      authFetch("/api/migrate-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldDeviceId: currentDeviceId, newDeviceId: userId }),
      }).catch(() => {});
    }

    // Set device_id to user ID
    localStorage.setItem("musu_device_id", userId);
  }, []);

  // Load profile from profiles table
  const loadProfile = useCallback(async (userId: string, email: string) => {
    // Clear previous account data from localStorage FIRST to prevent leaks
    localStorage.removeItem("musu_business_info");
    localStorage.removeItem("musu_memory_summary");
    bindDeviceId(userId);
    // Fetch profile (1 attempt, then fallback to ensure-profile)
    let data = null;
    const profileRes = await supabase.from("profiles").select("display_name, avatar_url, business_info, memory_summary, news_enabled, news_time, news_times, google_calendar_connected, trello_connected, schedule_delivery_enabled").eq("id", userId).single();
    data = profileRes.data;
    // Auto-create profile only if it truly doesn't exist (e.g. first Google login)
    // Use service-side API to avoid RLS issues
    if (!data) {
      try {
        await authFetch("/api/ensure-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: email.split("@")[0] }),
        });
        const res = await supabase.from("profiles").select("display_name, avatar_url, business_info, memory_summary, news_enabled, news_time, news_times, google_calendar_connected, trello_connected, schedule_delivery_enabled").eq("id", userId).single();
        data = res.data;
      } catch {}
    }
    setDisplayName(data?.display_name || email.split("@")[0]);
    setAvatarUrl(data?.avatar_url || "");
    setBusinessInfo(data?.business_info || "");
    setMemorySummary(data?.memory_summary || "");
    setNewsEnabled(data?.news_enabled ?? false);
    setNewsTime(data?.news_time || "07:00");
    try {
      const parsed = data?.news_times ? JSON.parse(data.news_times) : null;
      setNewsTimes(Array.isArray(parsed) && parsed.length > 0 ? parsed : [data?.news_time || "07:00"]);
    } catch {
      setNewsTimes([data?.news_time || "07:00"]);
    }
    setGoogleCalendarConnected(data?.google_calendar_connected ?? false);
    setTrelloConnected(data?.trello_connected ?? false);
    setScheduleDeliveryEnabled(data?.schedule_delivery_enabled ?? false);
    // Only set localStorage if this account has data
    localStorage.setItem("musu_business_info", data?.business_info || "");
    localStorage.setItem("musu_memory_summary", data?.memory_summary || "");
  }, [bindDeviceId]);

useEffect(() => {
    let cancelled = false;

    // Use onAuthStateChange as the single source of truth.
    // It fires INITIAL_SESSION on mount (replaces manual getSession call).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      // Password recovery: redirect to change password page (only from actual reset link)
      if (event === "PASSWORD_RECOVERY" && session?.user) {
        const hash = window.location.hash || "";
        const params = new URLSearchParams(window.location.search);
        if (hash.includes("type=recovery") || params.get("type") === "recovery") {
          window.location.href = "/settings/account";
          return;
        }
        // Not from a reset link — treat as normal sign-in
      }

      if (cancelled) return;

      const currentUser = session?.user ?? null;

      // Set user and loading immediately (don't block UI)
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Block new Google signups when registration is disabled
        // Use creation timestamp (instant, no DB query needed)
        if (event === "SIGNED_IN") {
          const isOAuth = currentUser.app_metadata?.provider === "google";
          const createdAt = new Date(currentUser.created_at).getTime();
          const isNewUser = (Date.now() - createdAt) < 30000; // Created within 30s
          if (isOAuth && isNewUser) {
            try {
              const checkRes = await fetch("/api/signup-check");
              const checkData = await checkRes.json();
              if (!checkData.signupEnabled) {
                await supabase.auth.signOut();
                if (!cancelled) {
                  setUser(null);
                }
                alert("現在、新規登録を停止しています。");
                return;
              }
            } catch {}
          }
        }

        // Load profile in background (don't block UI transition)
        loadProfile(currentUser.id, currentUser.email || "").catch((err) => {
          console.error("Profile load failed:", err);
        });
      }
    });

    // Safety timeout: if onAuthStateChange never fires (network issue), unblock UI
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    // Check if signup is enabled
    try {
      const checkRes = await fetch("/api/signup-check");
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (!checkData.signupEnabled) {
          return { error: "現在、新規登録を停止しています。" };
        }
      }
    } catch {}

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

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
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
    setNewsTimes(["07:00"]);
    setGoogleCalendarConnected(false);
    setTrelloConnected(false);
    setScheduleDeliveryEnabled(false);
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

  const updateNewsSettings = useCallback(async (enabled: boolean, time: string, times?: string[]) => {
    if (!user) return { error: "Not logged in" };
    const effectiveTimes = times || [time];
    const { error } = await supabase.from("profiles").update({
      news_enabled: enabled,
      news_time: time,
      news_times: JSON.stringify(effectiveTimes),
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (!error) {
      setNewsEnabled(enabled);
      setNewsTime(time);
      setNewsTimes(effectiveTimes);
    }
    return { error: error?.message || null };
  }, [user]);

  const updateScheduleDelivery = useCallback(async (enabled: boolean) => {
    if (!user) return { error: "Not logged in" };
    const { error } = await supabase.from("profiles").update({
      schedule_delivery_enabled: enabled,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (!error) setScheduleDeliveryEnabled(enabled);
    return { error: error?.message || null };
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadProfile(user.id, user.email || "");
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider value={{ user, displayName, avatarUrl, businessInfo, memorySummary, newsEnabled, newsTime, newsTimes, googleCalendarConnected, trelloConnected, scheduleDeliveryEnabled, loading, signUp, signIn, signInWithGoogle, signOut, updateDisplayName, updateAvatarUrl, updateBusinessInfo, updateNewsSettings, updateScheduleDelivery, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
