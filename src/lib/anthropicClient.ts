import Anthropic from "@anthropic-ai/sdk";

// SDK auto-retries 500, 529, 429, 408, 409 errors with exponential backoff.
// Default is 2 retries. Increase to 4 for intermittent Opus 500s.
// Backoff: 0.5s → 1s → 2s → 4s (with jitter), max 8s per wait.
export const anthropic = new Anthropic({
  maxRetries: 4,
  timeout: 120_000,
});
