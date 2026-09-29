const KEY = "__geminiRateLimitUntil";
const DAILY = "__geminiRateLimitDaily";

type Store = typeof globalThis & { [KEY]?: number; [DAILY]?: boolean };

export function rateLimitRemainingMs(now = Date.now()): number {
  const until = (globalThis as Store)[KEY] ?? 0;
  return until > now ? until - now : 0;
}

export function startRateLimitCooldown(ms: number, now = Date.now(), daily = false): void {
  const store = globalThis as Store;
  if (now + ms >= (store[KEY] ?? 0)) {
    store[KEY] = now + ms;
    store[DAILY] = daily;
  }
}

export function rateLimitCooldownIsDaily(now = Date.now()): boolean {
  return rateLimitRemainingMs(now) > 0 && Boolean((globalThis as Store)[DAILY]);
}

export function clearRateLimitCooldown(): void {
  (globalThis as Store)[KEY] = 0;
  (globalThis as Store)[DAILY] = false;
}
