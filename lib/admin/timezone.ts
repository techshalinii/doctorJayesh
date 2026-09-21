/**
 * Wall-clock ↔ UTC conversion for the scheduler.
 *
 * The author picks "14:30 on 3 October" in a named zone. `publish_at` stores the UTC
 * instant that corresponds to, because the visibility rule compares it against
 * `now()` — comparing a floating local time against a server clock is how scheduled
 * posts go live at the wrong hour.
 *
 * Done with `Intl` rather than a date library: the zone database ships with the
 * runtime, so there is nothing to keep updated and nothing added to the bundle.
 */

export const DEFAULT_TIME_ZONE = "Asia/Kolkata";

/** Offered in the picker. Asia/Kolkata first — it is what every post will use. */
export const TIME_ZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
] as const;

/**
 * How far ahead of UTC `timeZone` is at `instant`, in milliseconds.
 *
 * Derived by formatting the instant in the target zone and reading the result back as
 * if it were UTC — the difference is the offset, including whatever DST rule applies
 * on that date.
 */
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

  // `hour` can format as 24 for midnight under hour12:false in some runtimes.
  const hour = get("hour") % 24;

  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return asIfUtc - instant.getTime();
}

/**
 * `"2026-10-03"` + `"14:30"` in `timeZone` → the UTC instant.
 *
 * Solved twice because the offset depends on the very instant being computed: near a
 * DST boundary the first guess can land on the wrong side of the transition, and the
 * second pass corrects it. A third pass would never change the answer.
 */
export function wallTimeToUtc(date: string, time: string, timeZone: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;

  const naive = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));

  let instant = new Date(naive - zoneOffsetMs(new Date(naive), timeZone));
  instant = new Date(naive - zoneOffsetMs(instant, timeZone));

  return Number.isFinite(instant.getTime()) ? instant : null;
}

/** The inverse — for filling `<input type="date">` and `<input type="time">`. */
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

/** `3 Oct 2026, 2:30 pm IST` — the list and editor both show the time, not just the date. */
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

/** Split form, so the table can put the time on its own line under the date. */
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
