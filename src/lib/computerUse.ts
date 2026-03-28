/**
 * Computer Use action executor
 * Translates Claude Computer Use API actions into Playwright operations
 * and returns screenshots for the next iteration.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Page = any;

interface ComputerUseAction {
  action: "screenshot" | "click" | "double_click" | "triple_click" | "type" | "key" | "scroll" | "cursor_position" | "left_click_drag" | "right_click" | "middle_click" | "wait";
  coordinate?: [number, number];
  text?: string;
  duration?: number;
  scroll_direction?: "up" | "down" | "left" | "right";
  scroll_amount?: number;
  start_coordinate?: [number, number];
}

interface ComputerUseResult {
  /** base64 PNG screenshot */
  screenshot?: string;
  /** error message if action failed */
  error?: string;
}

const DISPLAY_WIDTH = 1280;
const DISPLAY_HEIGHT = 800;

/**
 * Initialize a Playwright page for Computer Use with the correct viewport
 */
export async function initComputerUsePage(page: Page): Promise<void> {
  await page.setViewportSize({ width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT });
}

/**
 * Take a screenshot and return as base64 PNG
 */
async function takeScreenshot(page: Page): Promise<string> {
  const buffer: Buffer = await page.screenshot({ type: "png" });
  return buffer.toString("base64");
}

/**
 * Execute a single Computer Use action and return a screenshot
 */
export async function executeComputerUseAction(
  page: Page,
  action: ComputerUseAction,
): Promise<ComputerUseResult> {
  try {
    switch (action.action) {
      case "screenshot": {
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      case "click": {
        if (!action.coordinate) return { error: "click requires coordinate" };
        const [x, y] = action.coordinate;
        await page.mouse.click(x, y);
        await page.waitForTimeout(300);
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      case "double_click": {
        if (!action.coordinate) return { error: "double_click requires coordinate" };
        const [x, y] = action.coordinate;
        await page.mouse.dblclick(x, y);
        await page.waitForTimeout(300);
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      case "triple_click": {
        if (!action.coordinate) return { error: "triple_click requires coordinate" };
        const [x, y] = action.coordinate;
        await page.mouse.click(x, y, { clickCount: 3 });
        await page.waitForTimeout(300);
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      case "right_click": {
        if (!action.coordinate) return { error: "right_click requires coordinate" };
        const [x, y] = action.coordinate;
        await page.mouse.click(x, y, { button: "right" });
        await page.waitForTimeout(300);
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      case "middle_click": {
        if (!action.coordinate) return { error: "middle_click requires coordinate" };
        const [x, y] = action.coordinate;
        await page.mouse.click(x, y, { button: "middle" });
        await page.waitForTimeout(300);
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      case "type": {
        if (!action.text) return { error: "type requires text" };
        await page.keyboard.type(action.text, { delay: 20 });
        await page.waitForTimeout(300);
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      case "key": {
        if (!action.text) return { error: "key requires text (key combo)" };
        // Convert Computer Use key format to Playwright format
        // e.g. "Return" → "Enter", "space" → " ", "ctrl+a" → "Control+a"
        const key = convertKeyCombo(action.text);
        await page.keyboard.press(key);
        await page.waitForTimeout(300);
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      case "scroll": {
        if (!action.coordinate) return { error: "scroll requires coordinate" };
        const [x, y] = action.coordinate;
        const direction = action.scroll_direction || "down";
        const amount = action.scroll_amount || 3;
        const deltaMap = {
          up: { deltaX: 0, deltaY: -120 * amount },
          down: { deltaX: 0, deltaY: 120 * amount },
          left: { deltaX: -120 * amount, deltaY: 0 },
          right: { deltaX: 120 * amount, deltaY: 0 },
        };
        const { deltaX, deltaY } = deltaMap[direction];
        await page.mouse.move(x, y);
        await page.mouse.wheel(deltaX, deltaY);
        await page.waitForTimeout(500);
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      case "left_click_drag": {
        if (!action.start_coordinate || !action.coordinate) {
          return { error: "left_click_drag requires start_coordinate and coordinate" };
        }
        const [sx, sy] = action.start_coordinate;
        const [ex, ey] = action.coordinate;
        await page.mouse.move(sx, sy);
        await page.mouse.down();
        await page.mouse.move(ex, ey, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(300);
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      case "cursor_position": {
        // Playwright doesn't track cursor position natively, return screenshot
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      case "wait": {
        const ms = action.duration ? action.duration * 1000 : 2000;
        await page.waitForTimeout(Math.min(ms, 10000));
        const screenshot = await takeScreenshot(page);
        return { screenshot };
      }

      default:
        return { error: `Unknown action: ${action.action}` };
    }
  } catch (err) {
    // Still try to take a screenshot on error so Claude can see what happened
    try {
      const screenshot = await takeScreenshot(page);
      return { screenshot, error: err instanceof Error ? err.message : String(err) };
    } catch {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }
}

/**
 * Convert Computer Use key names to Playwright key names
 */
function convertKeyCombo(key: string): string {
  // Handle combos like "ctrl+a", "alt+Tab"
  const parts = key.split("+").map((k) => {
    const lower = k.trim().toLowerCase();
    const map: Record<string, string> = {
      return: "Enter",
      enter: "Enter",
      space: " ",
      ctrl: "Control",
      control: "Control",
      cmd: "Meta",
      command: "Meta",
      meta: "Meta",
      alt: "Alt",
      option: "Alt",
      shift: "Shift",
      tab: "Tab",
      escape: "Escape",
      esc: "Escape",
      backspace: "Backspace",
      delete: "Delete",
      arrowup: "ArrowUp",
      arrowdown: "ArrowDown",
      arrowleft: "ArrowLeft",
      arrowright: "ArrowRight",
      up: "ArrowUp",
      down: "ArrowDown",
      left: "ArrowLeft",
      right: "ArrowRight",
      home: "Home",
      end: "End",
      pageup: "PageUp",
      pagedown: "PageDown",
      page_up: "PageUp",
      page_down: "PageDown",
    };
    return map[lower] || k.trim();
  });
  return parts.join("+");
}

export { DISPLAY_WIDTH, DISPLAY_HEIGHT };
export type { ComputerUseAction, ComputerUseResult };
