import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_API_PATHS = [
  "/api/signup",
  "/api/signup-check",
  "/api/reset-password",
  "/api/feedback-check",
  "/api/cron/",
  "/api/stripe/webhook",
  "/api/ensure-profile",
];

export async function middleware(req: NextRequest) {
  // Create response and Supabase SSR client that reads/writes cookies
  let response = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on both the request (for downstream) and response (for browser)
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: new Headers(req.headers) },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // IMPORTANT: Always call getUser() to refresh the session cookie.
  // This must happen for ALL routes (pages + API) so that the session stays alive.
  const { data: { user } } = await supabase.auth.getUser();

  // For non-API routes, just return the response with refreshed cookies
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return response;
  }

  // --- API route auth below ---

  const isPublic = PUBLIC_API_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  const isCallback = req.nextUrl.pathname.includes("/callback");
  const isOAuthStart = req.nextUrl.pathname.endsWith("/auth") && req.method === "GET";
  if (isPublic || isCallback || isOAuthStart) {
    return response;
  }

  // Allow internal server-to-server calls
  const internalSecret = req.headers.get("x-internal-secret");
  const existingUserId = req.headers.get("x-verified-user-id");
  if (internalSecret && existingUserId && internalSecret === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return response;
  }

  // 1. If cookie-based auth succeeded, set verified user ID
  if (user) {
    response.headers.set("x-verified-user-id", user.id);
    // Also set on request headers for downstream route handlers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-verified-user-id", user.id);
    const authedResponse = NextResponse.next({ request: { headers: requestHeaders } });
    // Copy cookie refresh headers to the new response
    response.headers.forEach((value, key) => {
      authedResponse.headers.set(key, value);
    });
    response.cookies.getAll().forEach((cookie) => {
      authedResponse.cookies.set(cookie.name, cookie.value);
    });
    return authedResponse;
  }

  // 2. Fallback: Check Authorization Bearer header (from authFetch)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const supabaseWithToken = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: { user: tokenUser } } = await supabaseWithToken.auth.getUser();
    if (tokenUser) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-verified-user-id", tokenUser.id);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
