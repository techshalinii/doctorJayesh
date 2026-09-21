"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
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

export function AppointmentForm() {
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

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {/* Honeypot. Hidden from people and from screen readers; bots that fill every input
          give themselves away and the server drops the submission. */}
      <div aria-hidden className="hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className={label}>Full Name</label>
        <input id="name" name="name" required placeholder="Your name" className={field} />
      </div>
      <div>
        <label htmlFor="phone" className={label}>Phone</label>
        <input id="phone" name="phone" type="tel" required placeholder="+91 …" className={field} />
      </div>
      <div>
        <label htmlFor="email" className={label}>Email</label>
        <input id="email" name="email" type="email" placeholder="you@email.com" className={field} />
      </div>
      <div>
        <label htmlFor="service" className={label}>Service</label>
        <select id="service" name="service" className={field} defaultValue="">
          <option value="" disabled>Select a service</option>
          {services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="date" className={label}>Preferred Date</label>
        <input id="date" name="date" type="date" className={field} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className={label}>Message (optional)</label>
        <textarea id="message" name="message" rows={3} placeholder="Briefly describe your condition…" className={field} />
      </div>
      <div className="sm:col-span-2">
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
        <ButtonAction type="submit" size="lg" className="w-full" disabled={state === "loading"}>
          {state === "loading" ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</>
          ) : (
            "Request Appointment"
          )}
        </ButtonAction>
        <p className="mt-3 text-center text-xs text-muted">
          By submitting you agree to be contacted about your appointment. Your details stay private.
        </p>
      </div>
    </form>
  );
}
