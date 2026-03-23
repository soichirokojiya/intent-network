import { NextRequest } from "next/server";

/**
 * Get verified user ID from middleware-injected header.
 * The middleware validates the Supabase Auth session and sets this header.
 */
export function getVerifiedUserId(req: NextRequest): string | null {
  return req.headers.get("x-verified-user-id") || null;
}

/**
 * Validate that a string is a valid UUID format
 */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str,
  );
}

/**
 * Sanitize string input - remove potential injection characters
 */
export function sanitizeInput(str: string, maxLength: number = 1000): string {
  return str.slice(0, maxLength).replace(/[<>]/g, "");
}
