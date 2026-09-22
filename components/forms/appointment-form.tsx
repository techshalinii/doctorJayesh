"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { ButtonAction } from "@/components/ui/button";
import { doctor } from "@/lib/data";

const services = [
  "Brain Tumor Surgery",
  "Spine Surgery",
  "Minimally Invasive Spine",
  "Deep Brain Stimulation",
  "General Consultation",
  "Second Opinion",
];

const field =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/25";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted";

/**
 * `compact` is the homepage <BookAppointment> band only. That section sits between two
 * others, so the two-column stack ran to nearly a full screen of height there; on a
 * dedicated page like /appointment/ that height is the point, which is why this is opt-in
 * and "default" is byte-for-byte the layout every other caller already had.
 *
 * Only the grid placement changes — field styling, markup, names, validation and the
 * submit path are shared by both variants, so there is one form to keep correct.
 */
type Variant = "default" | "compact";

/**
 * Per-cell placement. Mobile is a single column in both variants and tablet is two, so the
 * compact layout only diverges at lg: a 12-column grid running
 *   name | phone                        (6 + 6)
 *   email                               (12 — full width)
 *   date | service                      (6 + 6)
 *   message                             (12 — full width)
 *   button, privacy line beneath it     (centred, 12)
 *
 * Two fields to a row, never four. Four 3-column cells do fit, but they left every input
 * around 230px — narrow enough that a full name or an email ran out of box while being
 * typed. Height is bought back from the gaps and the section padding instead, which costs
 * nothing in usability.
 */
const cells = {
  default: {
    grid: "grid gap-4 sm:grid-cols-2",
    half: "",
    email: "",
    date: "sm:col-span-2",
    message: "sm:col-span-2",
    footer: "sm:col-span-2",
    actions: "",
    button: "w-full",
    note: "mt-3 text-center text-xs text-muted",
    rows: 3,
  },
  compact: {
    grid: "grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-12",
    half: "lg:col-span-6",
    // Email and message run the full width: both hold the longest values on the form, and
    // a full-width row between two paired rows gives the grid its rhythm.
    email: "sm:col-span-2 lg:col-span-12",
    date: "lg:col-span-6",
    message: "sm:col-span-2 lg:col-span-12",
    footer: "mt-1 sm:col-span-2 lg:col-span-12",
    // Centred column: the CTA reads as a decision, not as a seventh field, and the privacy
    // line sits under it rather than beside it.
    actions: "flex flex-col items-center gap-3",
    // Full width on a phone so the tap target never shrinks; 480px from sm up, capped by
    // the form so it can never overflow a narrow container.
    button: "w-full sm:w-[min(100%,30rem)]",
    note: "max-w-md text-center text-xs text-muted",
    rows: 3,
  },
} as const satisfies Record<Variant, Record<string, string | number>>;

export function AppointmentForm({ variant = "default" }: { variant?: Variant } = {}) {
  const c = cells[variant];
  const compact = variant === "compact";
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  /**
   * Posts to /api/appointment, which emails the practice.
   *
   * "done" is only reached on a 2xx. The previous version resolved a setTimeout and showed
   * the confirmation unconditionally, which told patients a care team had their details
   * when nothing had been sent — so a failure here has to stay on the form and say so.
   */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("loading");

    const data = Object.fromEntries(new FormData(e.currentTarget));

    try {
      const res = await fetch("/api/appointment/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));

      if (!res.ok || !payload.ok) {
        setError(payload.error ?? "Something went wrong. Please call us instead.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("We could not reach the server. Please check your connection or call us.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-teal-200 bg-teal-500/5 p-6 text-center sm:p-10">
        <CheckCircle2 className="h-14 w-14 text-teal-500" />
        <h3 className="text-xl font-semibold text-navy-900 dark:text-white">Request received</h3>
        <p className="max-w-sm text-sm text-muted">
          Thank you. Our care team will call you shortly to confirm your appointment time.
        </p>
        {/* Brand fill like every other button on the homepage. This form also renders on
            /appointment and /contact-us, so those two get the same treatment — consistent
            rather than scoped, since there is no per-page variant to thread through. */}
        <ButtonAction onClick={() => setState("idle")}>Book another</ButtonAction>
      </div>
    );
  }

  const serviceCell = (
    <div className={c.half}>
      <label htmlFor="service" className={label}>Service</label>
      <select id="service" name="service" className={field} defaultValue="">
        <option value="" disabled>Select a service</option>
        {services.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );

  const dateCell = (
    <div className={c.date}>
      <label htmlFor="date" className={label}>Preferred Date</label>
      <input id="date" name="date" type="date" className={field} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className={c.grid}>
      {/* Honeypot. Hidden from people and from screen readers; bots that fill every input
          give themselves away and the server drops the submission. */}
      <div aria-hidden className="hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={c.half}>
        <label htmlFor="name" className={label}>Full Name</label>
        <input id="name" name="name" required placeholder="Your name" className={field} />
      </div>
      <div className={c.half}>
        <label htmlFor="phone" className={label}>Phone</label>
        <input id="phone" name="phone" type="tel" required placeholder="+91 …" className={field} />
      </div>
      <div className={c.email}>
        <label htmlFor="email" className={label}>Email</label>
        <input id="email" name="email" type="email" placeholder="you@email.com" className={field} />
      </div>
      {/* Date before service in the compact grid, service before date everywhere else.
          Swapped in the markup rather than with CSS `order`, which moves a field visually
          without moving it in the tab sequence — the two would then disagree. */}
      {compact ? <>{dateCell}{serviceCell}</> : <>{serviceCell}{dateCell}</>}
      <div className={c.message}>
        <label htmlFor="message" className={label}>Message (optional)</label>
        <textarea id="message" name="message" rows={c.rows} placeholder="Briefly describe your condition…" className={field} />
      </div>
      <div className={c.footer}>
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-xl border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-800 dark:border-white/15 dark:bg-white/5 dark:text-white/80"
          >
            {error} You can reach us on{" "}
            <a href={`tel:${doctor.phoneRaw}`} className="font-semibold underline underline-offset-2">
              {doctor.phone}
            </a>
            .
          </p>
        )}
        <div className={c.actions}>
          <ButtonAction type="submit" size="lg" className={c.button} disabled={state === "loading"}>
            {state === "loading" ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</>
            ) : compact ? (
              // Same trailing arrow the site's other "Book an Appointment" CTAs carry.
              <>Request Appointment <ArrowRight className="h-5 w-5" aria-hidden /></>
            ) : (
              "Request Appointment"
            )}
          </ButtonAction>
          <p className={c.note}>
            By submitting you agree to be contacted about your appointment. Your details stay private.
          </p>
        </div>
      </div>
    </form>
  );
}
