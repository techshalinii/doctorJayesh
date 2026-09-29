export type RetryAction =
  | { action: "wait"; waitMs: number; reason: string }
  | { action: "fail"; reason: string };

export const MAX_TRANSIENT_RETRIES = 1;

export const BUSY_BACKOFF_MS = 4000;
export const RATE_LIMIT_BACKOFF_MS = 5000;

export const MAX_INLINE_WAIT_MS = 20_000;

export const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 30_000;

export const MAX_RETRY_HINT_MS = 10 * 60_000;

export const JITTER_MS = 400;

export interface RetryInput {
  status: number;
  retriesUsed: number;
  retryAfterMs?: number | null;
  dailyQuota?: boolean;
  jitter?: () => number;
}

export function decideRetry({
  status,
  retriesUsed,
  retryAfterMs = null,
  dailyQuota = false,
  jitter = () => Math.random() * JITTER_MS,
}: RetryInput): RetryAction {
  if (status !== 429 && status !== 503) {
    return { action: "fail", reason: `unrecoverable (${status})` };
  }

  if (status === 429 && dailyQuota) {
    return { action: "fail", reason: "daily request quota exhausted" };
  }

  const label = status === 429 ? "rate-limited" : "model busy";

  if (retriesUsed >= MAX_TRANSIENT_RETRIES) {
    return { action: "fail", reason: `${label}; retry budget spent` };
  }

  if (retryAfterMs && retryAfterMs > MAX_INLINE_WAIT_MS) {
    return { action: "fail", reason: `${label}; server asked for ${Math.ceil(retryAfterMs / 1000)}s` };
  }

  const base = retryAfterMs ?? (status === 429 ? RATE_LIMIT_BACKOFF_MS : BUSY_BACKOFF_MS);
  return {
    action: "wait",
    waitMs: Math.round(base + jitter()),
    reason: retryAfterMs ? `${label}, honouring server delay` : `${label}, backing off`,
  };
}

export function readRetryAfter(headers: Headers): number | null {
  return clampHint(parseRetryAfter(headers.get("retry-after")));
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now();
}

function clampHint(ms: number | null): number | null {
  return ms !== null && Number.isFinite(ms) && ms > 0 && ms <= MAX_RETRY_HINT_MS ? ms : null;
}

export interface GeminiErrorInfo {
  status: string;
  message: string;
  retryDelayMs: number | null;
  quotaIds: string[];
}

export function parseGeminiError(body: string): GeminiErrorInfo {
  const info: GeminiErrorInfo = { status: "", message: "", retryDelayMs: null, quotaIds: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    info.message = body.slice(0, 300);
    return info;
  }

  const error = (parsed as { error?: Record<string, unknown> })?.error;
  if (!error || typeof error !== "object") return info;

  info.status = typeof error.status === "string" ? error.status : "";
  info.message = typeof error.message === "string" ? error.message.slice(0, 300) : "";

  for (const detail of Array.isArray(error.details) ? error.details : []) {
    const d = detail as Record<string, unknown>;
    if (typeof d.retryDelay === "string") {
      const seconds = Number.parseFloat(d.retryDelay);
      if (Number.isFinite(seconds)) info.retryDelayMs = clampHint(seconds * 1000);
    }
    if (Array.isArray(d.violations)) {
      for (const v of d.violations as Record<string, unknown>[]) {
        if (typeof v.quotaId === "string") info.quotaIds.push(v.quotaId);
      }
    }
  }
  return info;
}

export function isDailyQuota(quotaIds: string[]): boolean {
  return quotaIds.some((id) => /PerDay/i.test(id));
}

export function msUntilDailyReset(now = Date.now()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hourCycle: "h23",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(now));
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);

  const sinceMidnight =
    ((part("hour") * 60 + part("minute")) * 60 + part("second")) * 1000 + (now % 1000);
  return 24 * 60 * 60 * 1000 - sinceMidnight;
}
