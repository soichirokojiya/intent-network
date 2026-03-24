import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/api/signup",
  "/api/signup-check",
  "/api/reset-password",
  "/api/feedback-check",
  "/api/cron/",
  "/api/stripe/webhook",
];

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  const isCallback = req.nextUrl.pathname.includes("/callback");
  const isOAuthStart = req.nextUrl.pathname.endsWith("/auth") && req.method === "GET";
  if (isPublic || isCallback || isOAuthStart) {
    return NextResponse.next();
  }

  // Allow internal server-to-server calls
  const internalSecret = req.headers.get("x-internal-secret");
  const existingUserId = req.headers.get("x-verified-user-id");
  if (internalSecret && existingUserId && internalSecret === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.next();
  }

  // 1. Check Authorization Bearer header first (from authFetch)
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

  // 2. Try Supabase Auth cookies
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => { res.cookies.set(name, value, options); });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-verified-user-id", user.id);
    return NextResponse.next({ request: { headers: requestHeaders }, headers: res.headers });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: ["/api/:path*"],
};
