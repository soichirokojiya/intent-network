import Anthropic from "@anthropic-ai/sdk";
import { stripHtml } from "./fetchUrl";

// DOM annotator script: injected into page to find and label interactable elements
const DOM_ANNOTATOR_SCRIPT = `
(() => {
  const SELECTORS = 'a, button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [onclick], [tabindex]:not([tabindex="-1"])';
  const els = document.querySelectorAll(SELECTORS);
  const results = [];
  let id = 1;
  for (const el of els) {
    if (el.offsetParent === null && el.tagName !== 'INPUT' && el.type !== 'hidden') continue;
    if (el.getAttribute('aria-hidden') === 'true') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0 && el.tagName !== 'INPUT') continue;
    el.setAttribute('data-bid', String(id));
    results.push({
      id,
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || '',
      text: (el.textContent || '').trim().slice(0, 80),
      name: el.getAttribute('name') || '',
      placeholder: el.getAttribute('placeholder') || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      href: el.tagName === 'A' ? (el.getAttribute('href') || '') : '',
      value: el.value !== undefined ? String(el.value).slice(0, 40) : '',
    });
    id++;
  }
  return results;
})()
`;

interface PageElement {
  id: number;
  tag: string;
  type: string;
  text: string;
  name: string;
  placeholder: string;
  ariaLabel: string;
  href: string;
  value: string;
}

interface BrowserAction {
  action: "click" | "type" | "select" | "wait";
  id?: number;
  value?: string;
}

// Format elements into a compact list for the LLM
function formatElements(elements: PageElement[]): string {
  return elements.map((el) => {
    const parts = [`[${el.id}]`, el.tag];
    if (el.type) parts.push(`[${el.type}]`);
    if (el.name) parts.push(`name="${el.name}"`);
    if (el.placeholder) parts.push(`"${el.placeholder}"`);
    if (el.ariaLabel) parts.push(`aria="${el.ariaLabel}"`);
    if (el.text && el.tag !== "input" && el.tag !== "textarea") parts.push(`"${el.text}"`);
    if (el.href) parts.push(`→ ${el.href}`);
    if (el.value) parts.push(`val="${el.value}"`);
    return parts.join(" ");
  }).join("\n");
}

// Ask Haiku to plan actions based on elements and instruction
async function planActions(
  client: Anthropic,
  elements: PageElement[],
  instruction: string,
  pageUrl: string,
  pageTitle: string,
): Promise<BrowserAction[]> {
  const elementList = formatElements(elements);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: `You control a browser. Given interactable elements and a goal, return a JSON array of actions.
Each action: {"action":"click"|"type"|"select"|"wait","id":<element_id>,"value":"<text>"}
Rules:
- Use element IDs from the list. NEVER invent IDs.
- For "type", include full text in "value".
- For "select", put the option text in "value".
- Return [] if no matching elements or goal already achieved.
- Max 5 actions.
Return ONLY the JSON array.`,
    messages: [{
      role: "user",
      content: `URL: ${pageUrl}\nTitle: ${pageTitle}\n\nElements:\n${elementList}\n\nGoal: ${instruction}`,
    }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text) return [];
  const raw = (text as { type: "text"; text: string }).text.trim();
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}

// Verify if the goal was achieved
async function verifyGoal(
  client: Anthropic,
  instruction: string,
  pageText: string,
  pageUrl: string,
): Promise<{ done: boolean; summary: string }> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `操作後のページ:\nURL: ${pageUrl}\n内容: ${pageText.slice(0, 3000)}\n\n目標: ${instruction}\n\n目標は達成された？JSON only:\n{"done":true/false,"summary":"何が起きたかを1文で"}`,
    }],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text) return { done: false, summary: "検証できませんでした" };
  const raw = (text as { type: "text"; text: string }).text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { done: false, summary: raw.slice(0, 100) };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { done: false, summary: raw.slice(0, 100) };
  }
}

// Main function: execute a browser action with AI-powered element detection
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeBrowserAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  instruction: string,
  client: Anthropic,
  maxRounds = 3,
): Promise<{ success: boolean; summary: string; url: string; pageText: string }> {
  let lastSummary = "";
  let lastPageText = "";

  for (let round = 0; round < maxRounds; round++) {
    // 1. Annotate DOM elements
    let elements: PageElement[];
    try {
      elements = await page.evaluate(DOM_ANNOTATOR_SCRIPT);
    } catch {
      elements = [];
    }

    const pageUrl = page.url();
    const pageTitle = await page.title().catch(() => "");

    if (elements.length === 0) {
      // No interactable elements — return page content
      const html = await page.content();
      lastPageText = stripHtml(html, 5000);
      return { success: false, summary: "操作可能な要素が見つかりませんでした", url: pageUrl, pageText: lastPageText };
    }

    // 2. Ask LLM to plan actions
    const actions = await planActions(client, elements, instruction, pageUrl, pageTitle);

    if (actions.length === 0) {
      const html = await page.content();
      lastPageText = stripHtml(html, 5000);
      return { success: true, summary: "操作不要（目標は達成済みまたは該当要素なし）", url: pageUrl, pageText: lastPageText };
    }

    // 3. Execute actions
    const executedActions: string[] = [];
    for (const action of actions) {
      try {
        const selector = `[data-bid="${action.id}"]`;
        switch (action.action) {
          case "click":
            await page.click(selector, { timeout: 8000 });
            executedActions.push(`Clicked [${action.id}]`);
            break;
          case "type":
            await page.fill(selector, action.value || "", { timeout: 8000 });
            executedActions.push(`Typed "${(action.value || "").slice(0, 20)}..." into [${action.id}]`);
            break;
          case "select":
            await page.selectOption(selector, { label: action.value }, { timeout: 8000 });
            executedActions.push(`Selected "${action.value}" in [${action.id}]`);
            break;
          case "wait":
            await page.waitForTimeout(2000);
            executedActions.push("Waited 2s");
            break;
        }
      } catch (err) {
        executedActions.push(`Failed [${action.id}] ${action.action}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 4. Wait for page to settle
    await page.waitForTimeout(1000);

    // 5. Get updated page content
    const html = await page.content();
    lastPageText = stripHtml(html, 5000);
    const currentUrl = page.url();

    // 6. Verify goal
    const verification = await verifyGoal(client, instruction, lastPageText, currentUrl);
    lastSummary = `${executedActions.join(", ")}. ${verification.summary}`;

    if (verification.done) {
      return { success: true, summary: lastSummary, url: currentUrl, pageText: lastPageText };
    }

    // Not done yet — loop with updated page state
  }

  return { success: false, summary: `${maxRounds}ラウンド実行したが目標未達成。${lastSummary}`, url: page.url(), pageText: lastPageText };
}
