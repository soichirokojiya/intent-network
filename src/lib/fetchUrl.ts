/**
 * URLからページ内容を取得してテキストに変換
 */
export async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; musu-bot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return `（${url}の取得に失敗: ${res.status}）`;

    const html = await res.text();

    // Extract text content from HTML
    let text = html
      // Remove scripts and styles
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      // Get meta description
      // Get meta description
      // Get title
      // Remove HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode entities
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
      // Clean whitespace
      .replace(/\s+/g, " ")
      .trim();

    // Truncate to avoid token explosion
    if (text.length > 2000) text = text.slice(0, 2000) + "...（以下省略）";

    return text || `（${url}のコンテンツを取得できませんでした）`;
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
