/**
 * Robustly extract JSON from LLM text output.
 * Handles: markdown fences, trailing commas, truncated JSON, plain text fallback.
 */
export function parseAgentJSON(raw: string): Record<string, unknown> {
  let text = raw
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .replace(/<cite[^>]*>|<\/cite>/g, "")
    .trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch { /* continue */ }

  // Extract JSON with balanced braces
  const jsonStr = extractBalancedJSON(text);
  if (jsonStr) {
    const fixed = jsonStr
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");

    try {
      return JSON.parse(fixed);
    } catch { /* continue */ }
  }

  // Extract individual fields from truncated JSON
  const toOwner = extractField(text, "toOwner");
  const toTimeline = extractField(text, "toTimeline");
  const directResponse = extractField(text, "directResponse");

  if (toOwner || directResponse) {
    return {
      ...(toOwner ? { toOwner } : {}),
      ...(toTimeline ? { toTimeline } : {}),
      ...(directResponse ? { directResponse } : {}),
      delegations: extractArray(text, "delegations"),
    };
  }

  // Last resort: return cleaned text
  const clean = text.replace(/[{}"]/g, "").replace(/toOwner\s*:/g, "").trim();
  return { toOwner: clean.slice(0, 1000), toTimeline: "" };
}

function extractBalancedJSON(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  // Truncated - auto-close
  if (depth > 0) return text.slice(start) + "}".repeat(depth);
  return null;
}

function extractField(text: string, field: string): string | null {
  const re = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)(?:"|$)`);
  const m = text.match(re);
  if (m) {
    return m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return null;
}

function extractArray(text: string, field: string): unknown[] {
  const re = new RegExp(`"${field}"\\s*:\\s*(\\[[\\s\\S]*?\\])`);
  const m = text.match(re);
  if (m) {
    try { return JSON.parse(m[1]); } catch { return []; }
  }
  return [];
}
