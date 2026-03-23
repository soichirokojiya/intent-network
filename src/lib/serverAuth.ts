import { NextRequest } from "next/server";

/**
 * Get user ID: prefer middleware-verified user ID, fallback to deviceId from query params.
 * For POST routes, call getVerifiedUserIdWithBody() instead.
 */
export function getVerifiedUserId(req: NextRequest): string | null {
  // Prefer middleware-verified user ID (set when Supabase Auth session exists)
  const verified = req.headers.get("x-verified-user-id");
  if (verified) return verified;

  // Fallback: deviceId from query params (backward compatibility)
  const fromQuery = req.nextUrl.searchParams.get("deviceId");
  if (fromQuery) return fromQuery;

  return null;
}

/**
 * Get user ID for POST/PATCH/DELETE routes where deviceId may be in the JSON body.
 * Must be called AFTER parsing the body.
 */
export function getVerifiedUserIdWithBody(req: NextRequest, body: Record<string, unknown>): string | null {
  const verified = req.headers.get("x-verified-user-id");
  if (verified) return verified;

  return (body?.deviceId as string) || null;
}

/**
 * Validate that a string is a valid UUID format
 */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Sanitize string input - remove potential injection characters
 */
export function sanitizeInput(str: string, maxLength: number = 1000): string {
  return str.slice(0, maxLength).replace(/[<>]/g, "");
}
