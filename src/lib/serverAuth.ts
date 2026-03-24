import { NextRequest } from "next/server";

/**
 * Get authenticated user ID from middleware-verified header.
 * Returns null if not authenticated — no fallback to client-provided IDs.
 */
export function getVerifiedUserId(req: NextRequest): string | null {
  return req.headers.get("x-verified-user-id") || null;
}

/**
 * Get authenticated user ID for POST/PATCH/DELETE routes.
 * Same as getVerifiedUserId — body.deviceId is NOT trusted.
 */
export function getVerifiedUserIdWithBody(req: NextRequest, _body: Record<string, unknown>): string | null {
  return req.headers.get("x-verified-user-id") || null;
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
