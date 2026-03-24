const STEEL_API_URL = "https://api.steel.dev/v1";

/**
 * URLからページ内容を取得してテキストに変換
 * Steel.dev APIが利用可能ならヘッドレスブラウザでJS描画後の内容を取得
 * フォールバックとして通常fetchも使用
 */
export async function fetchUrlContent(url: string): Promise<string> {
  const steelKey = process.env.STEEL_API_KEY;

  // Steel.dev available → use headless browser (handles SPA/JS-rendered pages)
  if (steelKey) {
    try {
      const res = await fetch(`${STEEL_API_URL}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Steel-Api-Key": steelKey,
        },
        body: JSON.stringify({ url, delay: 2000 }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const data = await res.json();
        // Steel returns { content: { html: "..." }, metadata: { title: "..." }, ... }
        const html = data.content?.html || data.content || "";
        const rawHtml = typeof html === "string" ? html : JSON.stringify(html);
        // Strip HTML tags to get clean text
        let text = rawHtml
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (text.length > 2000) text = text.slice(0, 2000) + "...（以下省略）";
        return text || `（${url}のコンテンツを取得できませんでした）`;
      }
    } catch {}
    // Fall through to simple fetch on failure
  }

  // Fallback: simple HTTP fetch (won't render JS)
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; musu-bot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return `（${url}の取得に失敗: ${res.status}）`;

    const html = await res.text();

    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

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
