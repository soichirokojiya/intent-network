import { createServerClient } from "@supabase/ssr";
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
  // Only process /api/* routes
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip public routes, OAuth callbacks, and admin (uses own ADMIN_PASSWORD auth)
  const isPublic = PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  const isCallback = req.nextUrl.pathname.includes("/callback");
  if (isPublic || isCallback) {
    return NextResponse.next();
  }

  // Allow internal server-to-server calls
  const internalSecret = req.headers.get("x-internal-secret");
  const existingUserId = req.headers.get("x-verified-user-id");
  if (
    internalSecret &&
    existingUserId &&
    internalSecret === process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.next();
  }

  // Try to extract user from Supabase Auth cookies
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Inject verified user ID for API routes
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-verified-user-id", user.id);
    return NextResponse.next({
      request: { headers: requestHeaders },
      headers: res.headers,
    });
  }

  // Non-blocking: pass through (auth checked in individual routes via adminAuth.ts)
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
