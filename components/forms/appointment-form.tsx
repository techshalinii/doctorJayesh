"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { ButtonAction } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
const fieldInvalid = "border-red-500 focus:border-red-500 focus:ring-red-500/25";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted";
const errorText = "mt-1.5 text-xs font-medium text-red-700 dark:text-red-400";

type Variant = "default" | "compact";

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
    email: "sm:col-span-2 lg:col-span-12",
    date: "lg:col-span-6",
    message: "sm:col-span-2 lg:col-span-12",
    footer: "mt-1 sm:col-span-2 lg:col-span-12",
    actions: "flex flex-col items-center gap-3",
    button: "w-full sm:w-[min(100%,30rem)]",
    note: "max-w-md text-center text-xs text-muted",
    rows: 3,
  },
} as const satisfies Record<Variant, Record<string, string | number>>;

type Values = {
  name: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  message: string;
  company: string;
};

const LIMITS = { name: 120, phone: 40, email: 160, message: 4000 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_RE = /^\+?[\d][\d\s().-]{6,}$/;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={errorText}>
      {message}
    </p>
  );
}

export function AppointmentForm({ variant = "default" }: { variant?: Variant } = {}) {
  const c = cells[variant];
  const compact = variant === "compact";
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    mode: "onTouched",
    defaultValues: { name: "", phone: "", email: "", service: "", date: "", message: "", company: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const res = await fetch("/api/appointment/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));

      if (!res.ok || !payload.ok) {
        setFormError(payload.error ?? "Something went wrong. Please call us instead.");
        return;
      }
      setSent(true);
    } catch {
      setFormError("We could not reach the server. Please check your connection or call us.");
    }
  });

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-teal-200 bg-teal-500/5 p-6 text-center sm:p-10">
        <CheckCircle2 className="h-14 w-14 text-teal-500" />
        <h3 className="text-xl font-semibold text-navy-900 dark:text-white">Request received</h3>
        <p className="max-w-sm text-sm text-muted">
          Thank you. Our care team will call you shortly to confirm your appointment time.
        </p>
        <ButtonAction
          onClick={() => {
            reset();
            setSent(false);
          }}
        >
          Book another
        </ButtonAction>
      </div>
    );
  }

  const serviceCell = (
    <div className={c.half}>
      <label htmlFor="service" className={label}>Service</label>
      <select id="service" className={field} defaultValue="" {...register("service")}>
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
      <input id="date" type="date" className={field} {...register("date")} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className={c.grid}>
      <div aria-hidden className="hidden">
        <label htmlFor="company">Company</label>
        <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
      </div>

      <div className={c.half}>
        <label htmlFor="name" className={label}>Full Name</label>
        <input
          id="name"
          placeholder="Your name"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={cn(field, errors.name && fieldInvalid)}
          {...register("name", {
            required: "Please tell us your name.",
            maxLength: { value: LIMITS.name, message: `Please keep this under ${LIMITS.name} characters.` },
          })}
        />
        <FieldError id="name-error" message={errors.name?.message} />
      </div>
      <div className={c.half}>
        <label htmlFor="phone" className={label}>Phone</label>
        <input
          id="phone"
          type="tel"
          placeholder="+91 …"
          autoComplete="tel"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "phone-error" : undefined}
          className={cn(field, errors.phone && fieldInvalid)}
          {...register("phone", {
            required: "A phone number is how the clinic confirms your slot.",
            maxLength: { value: LIMITS.phone, message: "That number looks too long." },
            pattern: { value: PHONE_RE, message: "Enter a number we can reach you on, e.g. +91 98765 43210." },
          })}
        />
        <FieldError id="phone-error" message={errors.phone?.message} />
      </div>
      <div className={c.email}>
        <label htmlFor="email" className={label}>Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@email.com"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={cn(field, errors.email && fieldInvalid)}
          {...register("email", {
            maxLength: { value: LIMITS.email, message: "That address looks too long." },
            pattern: { value: EMAIL_RE, message: "That email address looks wrong." },
          })}
        />
        <FieldError id="email-error" message={errors.email?.message} />
      </div>
      {compact ? <>{dateCell}{serviceCell}</> : <>{serviceCell}{dateCell}</>}
      <div className={c.message}>
        <label htmlFor="message" className={label}>Message (optional)</label>
        <textarea
          id="message"
          rows={c.rows}
          placeholder="Briefly describe your condition…"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={cn(field, errors.message && fieldInvalid)}
          {...register("message", {
            maxLength: {
              value: LIMITS.message,
              message: `Please keep this under ${LIMITS.message.toLocaleString()} characters.`,
            },
          })}
        />
        <FieldError id="message-error" message={errors.message?.message} />
      </div>
      <div className={c.footer}>
        {formError && (
          <p
            role="alert"
            className="mb-3 rounded-xl border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-800 dark:border-white/15 dark:bg-white/5 dark:text-white/80"
          >
            {formError} You can reach us on{" "}
            <a href={`tel:${doctor.phoneRaw}`} className="font-semibold underline underline-offset-2">
              {doctor.phone}
            </a>
            .
          </p>
        )}
        <div className={c.actions}>
          <ButtonAction type="submit" size="lg" className={c.button} disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</>
            ) : compact ? (
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
