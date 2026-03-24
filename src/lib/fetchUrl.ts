const STEEL_API_URL = "https://api.steel.dev/v1";

// In-memory cache for URL content (5-minute TTL)
const urlCache = new Map<string, { text: string; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * HTMLをプレーンテキストに変換（共通ユーティリティ）
 */
export function stripHtml(html: string, maxLength = 2000): string {
  // Early truncation: only process first portion of HTML to save CPU
  const truncatedHtml = html.length > maxLength * 5 ? html.slice(0, maxLength * 5) : html;
  let text = truncatedHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > maxLength) text = text.slice(0, maxLength) + "...（以下省略）";
  return text;
}

// JS-heavy sites that need Steel (headless browser rendering)
const JS_REQUIRED_PATTERNS = [
  /twitter\.com/i, /x\.com/i, /instagram\.com/i, /facebook\.com/i,
  /linkedin\.com/i, /reddit\.com/i, /youtube\.com/i,
  /notion\.so/i, /figma\.com/i, /vercel\.app/i,
  /react/i, /angular/i, /vue/i, // SPA frameworks in URL
];

function needsSteel(url: string): boolean {
  return JS_REQUIRED_PATTERNS.some((p) => p.test(url));
}

/**
 * URLからページ内容を取得してテキストに変換
 * 1. キャッシュチェック
 * 2. 静的サイト → plain fetch（高速）
 * 3. JS必須サイト or plain fetch失敗 → Steel.dev API
 */
export async function fetchUrlContent(url: string): Promise<string> {
  // Check cache first
  const cached = urlCache.get(url);
  if (cached && cached.expiry > Date.now()) return cached.text;

  const steelKey = process.env.STEEL_API_KEY;

  // Try plain fetch first for non-JS sites (much faster than Steel)
  if (!needsSteel(url)) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; musu-bot/1.0)" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const html = await res.text();
        const text = stripHtml(html) || `（${url}のコンテンツを取得できませんでした）`;
        // Only cache if we got meaningful content
        if (text.length > 50) {
          urlCache.set(url, { text, expiry: Date.now() + CACHE_TTL });
        }
        return text;
      }
    } catch {
      // Fall through to Steel
    }
  }

  // Steel.dev: for JS-heavy sites or when plain fetch fails
  if (steelKey) {
    try {
      const res = await fetch(`${STEEL_API_URL}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Steel-Api-Key": steelKey },
        body: JSON.stringify({ url, delay: 0 }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        const html = data.content?.html || data.content || "";
        const rawHtml = typeof html === "string" ? html : JSON.stringify(html);
        const text = stripHtml(rawHtml) || `（${url}のコンテンツを取得できませんでした）`;
        urlCache.set(url, { text, expiry: Date.now() + CACHE_TTL });
        return text;
      }
    } catch {}
  }

  // Last resort: plain fetch for JS sites when Steel fails
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; musu-bot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return `（${url}の取得に失敗: ${res.status}）`;
    const html = await res.text();
    const text = stripHtml(html) || `（${url}のコンテンツを取得できませんでした）`;
    urlCache.set(url, { text, expiry: Date.now() + CACHE_TTL });
    return text;
  } catch (e) {
    return `（${url}の取得に失敗: ${e instanceof Error ? e.message : "不明なエラー"}）`;
  }
}

/**
 * テキストからURLを抽出
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>]+/g;
  return [...new Set(text.match(urlRegex) || [])];
}
