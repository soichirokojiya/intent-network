import { NextRequest, NextResponse } from "next/server";

/**
 * Composio OAuth callback handler
 * After user authorizes on the external service, Composio redirects here.
 * Composio handles token storage internally - we just redirect the user back to musu.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // Redirect back to integrations page with success status
  const redirectTo = new URL("/integrations", process.env.NEXT_PUBLIC_APP_URL || "https://musu.world");
  redirectTo.searchParams.set("composio_connected", "true");

  // Pass through any error from Composio
  const error = url.searchParams.get("error");
  if (error) {
    redirectTo.searchParams.set("composio_error", error);
  }

  return NextResponse.redirect(redirectTo.toString());
}
