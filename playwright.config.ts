import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./scripts",
  timeout: 300_000,
  use: {
    headless: false,
    viewport: { width: 1440, height: 900 },
    video: {
      mode: "on",
      size: { width: 1440, height: 900 },
    },
    launchOptions: {
      slowMo: 30,
    },
  },
  outputDir: "./demo-output",
});
