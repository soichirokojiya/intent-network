/**
 * musu デモ動画 — スナッピー版
 *
 * 目標: 20-25秒、テンポよく、結果にフォーカス
 * パターン: ACTION(速) → RESULT(見せる) → ACTION(速) → RESULT(見せる) → PAYOFF
 *
 * DEMO_PASSWORD="xxx" npx playwright test --config=playwright.config.ts
 */

import { test, Page } from "@playwright/test";

const BASE_URL = "https://musu.world";
const LOGIN_EMAIL = process.env.DEMO_EMAIL || "koujiy@souichirou.org";
const LOGIN_PASSWORD = process.env.DEMO_PASSWORD || "";

// ============================================================
// タイミング — すべての時間を集約
// ============================================================
const T = {
  TYPE_DELAY: 10,        // ms/文字 — 超高速タイプ
  BEAT: 250,             // アクション前の溜め
  ADMIRE: 1200,          // 結果を見せる
  ADMIRE_SHORT: 800,     // 短め
  ADMIRE_LONG: 1800,     // 読む時間が必要なとき
  SCENE_CUT: 150,        // シーン間
  FINAL_HOLD: 2500,      // 最後の余韻
  ZOOM_IN: 500,          // ズームアニメーション待ち
  ZOOM_OUT: 400,
};

// ============================================================
// エフェクトCSS — 軽量版
// ============================================================
const DEMO_CSS = `
body {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.demo-caption {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100000;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 10px 24px;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  max-width: 70%;
  text-align: center;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
  pointer-events: none;
  opacity: 0;
  animation: cap-in 0.25s ease forwards;
  letter-spacing: 0.01em;
}
@keyframes cap-in {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
.demo-caption.out {
  animation: cap-out 0.2s ease forwards;
}
@keyframes cap-out {
  to { opacity: 0; }
}

.demo-spotlight {
  position: fixed;
  z-index: 99999;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5),
              0 0 30px 4px rgba(59, 130, 246, 0.25);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.demo-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
  z-index: 100001;
  transition: width 0.4s ease;
  pointer-events: none;
}

.demo-ripple {
  position: fixed;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(59, 130, 246, 0.8);
  z-index: 100002;
  pointer-events: none;
  animation: rip 0.5s ease-out forwards;
}
@keyframes rip {
  0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
}

.demo-hook {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100003;
  background: #0f172a;
  pointer-events: none;
}
.demo-hook h1 {
  color: white;
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -0.02em;
  opacity: 0;
  animation: h-in 0.5s ease 0.2s forwards;
}
.demo-hook p {
  color: rgba(255,255,255,0.5);
  font-size: 18px;
  margin-top: 12px;
  opacity: 0;
  animation: h-in 0.4s ease 0.7s forwards;
}
@keyframes h-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.demo-hook.out { animation: h-out 0.5s ease forwards; }
@keyframes h-out { to { opacity: 0; } }
`;

// ============================================================
// エフェクト関数
// ============================================================
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function injectCSS(page: Page) {
  await page.addStyleTag({ content: DEMO_CSS });
}

async function showHook(page: Page, title: string, sub: string, ms: number) {
  await page.evaluate(({ title, sub }) => {
    const d = document.createElement("div");
    d.className = "demo-hook"; d.id = "demo-hook";
    d.innerHTML = `<h1>${title}</h1><p>${sub}</p>`;
    document.body.appendChild(d);
  }, { title, sub });
  await sleep(ms);
  await page.evaluate(() => {
    const h = document.getElementById("demo-hook");
    if (h) { h.classList.add("out"); setTimeout(() => h.remove(), 500); }
  });
  await sleep(500);
}

async function caption(page: Page, text: string) {
  await page.evaluate((t) => {
    document.getElementById("demo-caption")?.remove();
    const c = document.createElement("div");
    c.className = "demo-caption"; c.id = "demo-caption"; c.textContent = t;
    document.body.appendChild(c);
  }, text);
}

async function clearCaption(page: Page) {
  await page.evaluate(() => {
    const c = document.getElementById("demo-caption");
    if (c) { c.classList.add("out"); setTimeout(() => c.remove(), 200); }
  });
}

async function progress(page: Page, pct: number) {
  await page.evaluate((p) => {
    let b = document.getElementById("demo-progress") as HTMLElement;
    if (!b) { b = document.createElement("div"); b.className = "demo-progress"; b.id = "demo-progress"; document.body.appendChild(b); }
    b.style.width = p + "%";
  }, pct);
}

async function spotlightLast(page: Page) {
  await page.evaluate(() => {
    const msgs = document.querySelectorAll("[class*='animate-fade-in']");
    const last = msgs[msgs.length - 1] as HTMLElement;
    if (!last) return;
    const r = last.getBoundingClientRect();
    let el = document.getElementById("demo-spotlight") as HTMLElement;
    if (!el) { el = document.createElement("div"); el.className = "demo-spotlight"; el.id = "demo-spotlight"; document.body.appendChild(el); }
    el.style.left = (r.left - 10) + "px"; el.style.top = (r.top - 10) + "px";
    el.style.width = (r.width + 20) + "px"; el.style.height = (r.height + 20) + "px";
  });
}

async function clearSpotlight(page: Page) {
  await page.evaluate(() => document.getElementById("demo-spotlight")?.remove());
}

async function ripple(page: Page, x: number, y: number) {
  await page.evaluate(({ x, y }) => {
    const r = document.createElement("div");
    r.className = "demo-ripple"; r.style.left = x + "px"; r.style.top = y + "px";
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 500);
  }, { x, y });
}

async function zoom(page: Page, target: string, scale: number) {
  if (target === "reset") {
    await page.evaluate(() => { document.body.style.transform = "scale(1)"; document.body.style.transformOrigin = "center center"; });
    return;
  }
  await page.evaluate(({ target, scale }) => {
    let ox = 50, oy = 50;
    if (target === "input") { ox = 45; oy = 88; }
    else if (target === "last-message") {
      const msgs = document.querySelectorAll("[class*='animate-fade-in']");
      const el = msgs[msgs.length - 1] as HTMLElement;
      if (el) { const r = el.getBoundingClientRect(); ox = ((r.left + r.width / 2) / window.innerWidth) * 100; oy = ((r.top + r.height / 2) / window.innerHeight) * 100; }
    } else if (target === "approve-btn") {
      for (const btn of document.querySelectorAll("button")) {
        if (btn.textContent?.includes("投稿する")) { const r = btn.getBoundingClientRect(); ox = ((r.left + r.width / 2) / window.innerWidth) * 100; oy = ((r.top + r.height / 2) / window.innerHeight) * 100; break; }
      }
    }
    document.body.style.transformOrigin = `${ox}% ${oy}%`;
    document.body.style.transform = `scale(${scale})`;
  }, { target, scale });
}

// 即貼り付け（テキスト全体を一瞬で入力、カーソル移動のみ見せる）
async function fastInput(page: Page, text: string) {
  const textarea = page.locator("textarea").first();
  await textarea.click();
  // 短いテキストは高速タイプ、長いテキストは即貼り付け
  if (text.length <= 20) {
    for (const char of text) {
      await textarea.type(char, { delay: T.TYPE_DELAY });
    }
  } else {
    // 最初の数文字だけタイプして、残りを一気に
    const preview = text.slice(0, 8);
    const rest = text.slice(8);
    for (const char of preview) {
      await textarea.type(char, { delay: T.TYPE_DELAY });
    }
    await textarea.evaluate((el: HTMLTextAreaElement, r: string) => {
      el.value += r;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, rest);
  }
}

// ============================================================
// SSE
// ============================================================
function buildSSE(text: string, isXDraft: boolean): string {
  const tag = isXDraft ? `\\n[x-draft:demo-draft-${Date.now()}]` : "";
  const esc = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  const json = `{"toOwner":"${esc}${tag}","toTimeline":"","mood":"confident"}`;
  const events: string[] = [];
  const cs = 20;
  for (let i = 0; i < json.length; i += cs) {
    events.push(`data: ${JSON.stringify({ type: "delta", text: json.slice(i, i + cs) })}\n\n`);
  }
  events.push(`data: ${JSON.stringify({ type: "done", toOwner: text + (isXDraft ? `\n[x-draft:demo-draft-${Date.now()}]` : ""), toTimeline: "", mood: "confident" })}\n\n`);
  return events.join("");
}

// ============================================================
// 台本 — 3ビート + ペイオフ（クレッシェンド）
// ============================================================
// Beat 1 (普通)  → Beat 2 (やや速い) → Beat 3 (速い) → Payoff (一瞬 → 余韻)

interface Beat {
  userText: string;
  reply: { text: string; isXDraft?: boolean };
  caption: string;
  /** 結果を見せる時間 */
  admireMs: number;
}

const BEATS: Beat[] = [
  {
    userText: "@Leo 来月のマーケ施策、何をすべき？",
    reply: {
      text: "3つの方向性があります。\n\n1️⃣ **ショート動画の強化** — Reels流入が前月比30%増\n2️⃣ **AI活用事例の発信** — ソロプレナー層の関心が高い\n3️⃣ **コミュニティ施策** — LTV向上\n\nまず①から始めて②に転用するのが効率的です。Otobe Asakoにクリエイティブを相談しましょうか？",
    },
    caption: "ストラテジストに戦略を相談",
    admireMs: 1800,
  },
  {
    userText: "@Otobe Asako ショート動画のコンセプト、ソロプレナー向けで考えて",
    reply: {
      text: "3つのコンセプト案です。\n\n🎬 **案A「Before/After」** — 導入前後の1日を比較\n🎬 **案B「30秒で分かるmusu」** — 指示→即実行をテンポよく\n🎬 **案C「リアルユーザーの声」** — 実際の画面でナレーション\n\n**案B**が一番バズりやすいです。投稿文も作りましょうか？",
    },
    caption: "マーケ担当にクリエイティブを依頼",
    admireMs: 1400,
  },
  {
    userText: "案Bでいこう。Xの投稿文も作って",
    reply: {
      text: "投稿文を作りました！\n\n「チームに話しかけるだけで、仕事が進む。\n\nmusuは、あなた専属のAIチーム。\nマーケ、戦略、リサーチ、秘書…\n必要な時に、必要な人が動いてくれる。\n\nソロでも、チームワークを。\n→ musu.world」\n\nこの内容で投稿しますか？",
      isXDraft: true,
    },
    caption: "X投稿のドラフトを自動生成",
    admireMs: 1200,
  },
];

// ============================================================
// テスト
// ============================================================
test("musu demo video", async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1440, height: 900 });

  // --- ログイン ---
  await page.goto(BASE_URL);
  await page.waitForLoadState("networkidle");
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector("textarea", { timeout: 15000 });
  } else {
    await page.waitForSelector("textarea", { timeout: 15000 });
  }
  await sleep(1000);
  await injectCSS(page);

  // --- APIインターセプト ---
  let currentReply: Beat["reply"] | null = null;

  await page.route("**/api/agent-respond", async (route) => {
    if (!currentReply) { await route.continue(); return; }
    const r = currentReply;
    // 返答までの「考え中」時間 — 短め
    await sleep(800);
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      body: buildSSE(r.text, !!r.isXDraft),
    });
  });

  await page.route("**/api/x/drafts/**", async (route) => {
    await sleep(500);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, tweetId: "demo-12345" }) });
  });
  await page.route("**/api/x/post", async (route) => {
    await sleep(500);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, tweetId: "demo-12345" }) });
  });
  await page.route("**/api/chat", async (route) => {
    if (["POST", "PATCH"].includes(route.request().method())) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    } else { await route.continue(); }
  });
  await page.route("**/api/agent-stats", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });

  // ============================================================
  // フック — 2秒で印象づける
  // ============================================================
  await showHook(page, "チームに話しかけるだけで、仕事が進む。", "musu", 2200);
  await progress(page, 0);

  // ============================================================
  // 3ビート — クレッシェンド
  // ============================================================
  for (let i = 0; i < BEATS.length; i++) {
    const beat = BEATS[i];
    const pct = ((i + 1) / (BEATS.length + 1)) * 100;
    currentReply = beat.reply;

    // キャプション
    await caption(page, beat.caption);

    // ズームイン → 高速入力
    await zoom(page, "input", 1.2);
    await sleep(T.ZOOM_IN);
    await fastInput(page, beat.userText);
    await sleep(T.BEAT);

    // 送信
    await page.keyboard.press("Enter");

    // ズームアウト（返答を待ちながら）
    await sleep(300);
    await zoom(page, "reset", 1);

    // エージェント返答を待つ
    await sleep(2000);

    // 返答にスポットライト＋ズーム
    await clearCaption(page);
    await spotlightLast(page);
    await zoom(page, "last-message", 1.3);
    await sleep(beat.admireMs); // ← ここが "見せる" 時間

    // リセット
    await clearSpotlight(page);
    await zoom(page, "reset", 1);
    await sleep(T.SCENE_CUT);

    await progress(page, pct);
  }

  // ============================================================
  // ペイオフ — 「投稿する」ボタンをクリック
  // ============================================================
  await caption(page, "ワンクリックで投稿");
  await zoom(page, "approve-btn", 1.5);
  await sleep(T.ZOOM_IN);

  const btn = page.locator('button:has-text("投稿する")').first();
  await btn.waitFor({ timeout: 5000 });
  const box = await btn.boundingBox();
  if (box) await ripple(page, box.x + box.width / 2, box.y + box.height / 2);
  await btn.click();
  await sleep(T.ADMIRE);

  await zoom(page, "reset", 1);
  await clearCaption(page);
  await progress(page, 100);

  // ============================================================
  // エンディング
  // ============================================================
  await sleep(500);
  await caption(page, "musu.world — あなたのAIチームを作ろう");
  await sleep(T.FINAL_HOLD);
  await clearCaption(page);
  await sleep(500);
});
