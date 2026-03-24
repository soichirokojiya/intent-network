import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cookie-based session: survives refresh, cache clear, and works with middleware
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch wrapper for /api/* calls.
 * With @supabase/ssr, cookies carry the session automatically.
 * We still attach a Bearer token as a fallback for edge cases
 * (e.g., cross-origin or when cookies haven't propagated yet).
 */
export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(options?.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return fetch(url, { ...options, headers, credentials: "same-origin" });
}
