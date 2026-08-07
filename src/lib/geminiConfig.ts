// File: src/lib/geminiConfig.ts

// Default kept conservative (known-stable) so upgrading is opt-in via env,
// not a silent behavior change on deploy. Override with GEMINI_MODEL, e.g.
// "gemini-3.6-flash", without touching code or redeploying logic.
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

// Google no longer publishes a fixed free-tier requests-per-day number in its
// docs — actual limits are per-project, change automatically, and are only
// visible live in the AI Studio dashboard (https://aistudio.google.com/rate-limit).
// So we NEVER hardcode an assumed daily cap here. If the user has checked
// their own live limit in AI Studio, they can optionally set
// GEMINI_DAILY_ESTIMATE to see a progress indicator against it — otherwise
// we only show the raw daily call count with no implied ceiling.
export function getGeminiDailyEstimate(): number | null {
  const raw = process.env.GEMINI_DAILY_ESTIMATE?.trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
