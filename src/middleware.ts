import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_API_PATTERNS = [
  "/api/signup",
  "/api/signup-check",
  "/api/reset-password",
  "/api/cron/",
  "/api/stripe/webhook",
  "/api/feedback-check",
];

export async function middleware(req: NextRequest) {
  // Only protect /api/* routes
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip public routes
  const isPublic = PUBLIC_API_PATTERNS.some((p) =>
    req.nextUrl.pathname.startsWith(p),
  );
  // OAuth callbacks are public
  const isCallback = req.nextUrl.pathname.includes("/callback");
  // POST to /api/admin/churn-survey is public (退会サーベイ)
  const isChurnSurveyPost =
    req.nextUrl.pathname === "/api/admin/churn-survey" && req.method === "POST";
  if (isPublic || isCallback || isChurnSurveyPost) {
    return NextResponse.next();
  }

  // Allow internal server-to-server calls that already have a verified user ID
  // These calls use SUPABASE_SERVICE_ROLE_KEY as a shared secret
  const internalSecret = req.headers.get("x-internal-secret");
  const existingUserId = req.headers.get("x-verified-user-id");
  if (
    internalSecret &&
    existingUserId &&
    internalSecret === process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.next();
  }

  // Create Supabase client with cookies
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

  if (!user) {
    // Fallback: check Authorization header (for API clients)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseWithToken = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: authHeader } },
        },
      );
      const {
        data: { user: tokenUser },
      } = await supabaseWithToken.auth.getUser();

      if (tokenUser) {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-verified-user-id", tokenUser.id);

        return NextResponse.next({
          request: { headers: requestHeaders },
          headers: res.headers,
        });
      }
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Set verified user ID in request header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-verified-user-id", user.id);

  return NextResponse.next({
    request: { headers: requestHeaders },
    headers: res.headers,
  });
}

export const config = {
  matcher: ["/api/:path*"],
};
