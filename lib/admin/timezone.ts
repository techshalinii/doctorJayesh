export const DEFAULT_TIME_ZONE = "Asia/Kolkata";

export const TIME_ZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
] as const;

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  const hour = get("hour") % 24;

  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return asIfUtc - instant.getTime();
}

export function wallTimeToUtc(date: string, time: string, timeZone: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;

  const naive = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));

  let instant = new Date(naive - zoneOffsetMs(new Date(naive), timeZone));
  instant = new Date(naive - zoneOffsetMs(instant, timeZone));

  return Number.isFinite(instant.getTime()) ? instant : null;
}

export function utcToWallTime(
  iso: string | null,
  timeZone: string,
): { date: string; time: string } {
  const instant = iso ? new Date(iso) : new Date();
  if (!Number.isFinite(instant.getTime())) return { date: "", time: "" };

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const hour = String(Number(get("hour")) % 24).padStart(2, "0");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
  };
}

export function formatInZone(iso: string | null, timeZone = DEFAULT_TIME_ZONE): string {
  if (!iso) return "—";
  const instant = new Date(iso);
  if (!Number.isFinite(instant.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(instant);
}

export function formatDateTimeParts(
  iso: string | null,
  timeZone = DEFAULT_TIME_ZONE,
): { date: string; time: string } {
  if (!iso) return { date: "—", time: "" };
  const instant = new Date(iso);
  if (!Number.isFinite(instant.getTime())) return { date: "—", time: "" };

  const opts = { timeZone } as const;
  return {
    date: new Intl.DateTimeFormat("en-IN", {
      ...opts,
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(instant),
    time: new Intl.DateTimeFormat("en-IN", {
      ...opts,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(instant),
  };
}
