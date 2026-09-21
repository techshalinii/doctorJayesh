"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { BlogStatus } from "@/lib/cms/types";

/**
 * Small shared pieces for the dashboard.
 *
 * Kept apart from `components/ui/*`, which is the public site's design system. The
 * dashboard is a dense working tool, not a patient-facing page — its controls are
 * smaller, tighter and plainer, and mixing the two vocabularies would degrade both.
 */

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wider text-navy-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

const controlBase =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-navy-900 outline-none transition-colors placeholder:text-muted/60 focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlBase, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlBase, "resize-y leading-relaxed", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlBase, "pr-8", props.className)} />;
}

export function AdminButton({
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-navy-900 text-white hover:bg-navy-800 disabled:bg-navy-900/40",
    secondary: "border border-border bg-white text-navy-900 hover:bg-surface",
    ghost: "text-muted hover:bg-surface hover:text-navy-900",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  } as const;

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
    />
  );
}

const STATUS_STYLES: Record<BlogStatus, string> = {
  published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  scheduled: "bg-amber-50 text-amber-700 ring-amber-200",
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  archived: "bg-slate-50 text-slate-400 ring-slate-200",
};

/**
 * `status` alone is not the whole truth: a row marked `published` with a future
 * `publish_at` is not public yet. The badge says so rather than letting the author
 * believe a post is live when the visibility rule disagrees.
 */
export function StatusBadge({ status, live }: { status: BlogStatus; live?: boolean }) {
  const label =
    status === "published" && live === false ? "Published · pending" : status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider ring-1 ring-inset",
        STATUS_STYLES[status],
      )}
    >
      {label}
    </span>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-white", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          {title && <h2 className="text-sm font-semibold text-navy-900">{title}</h2>}
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Banner({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "error" | "success";
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  } as const;
  return (
    <div className={cn("rounded-md border px-3 py-2 text-sm leading-relaxed", tones[tone])}>
      {children}
    </div>
  );
}

/**
 * Close-on-Escape for a dialog.
 *
 * Listens on `document`, not on the overlay element: a keydown only reaches a DOM node
 * that has focus, and an overlay div has none unless something inside it was clicked
 * first — so the obvious `onKeyDown` on the backdrop silently does nothing most of the
 * time.
 */
export function useEscapeKey(onClose: () => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
}

/** Centred overlay. `onClose` fires on backdrop click and on Escape. */
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEscapeKey(onClose);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-navy-950/40 p-4 sm:p-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full rounded-lg border border-border bg-white shadow-xl",
          wide ? "max-w-4xl" : "max-w-xl",
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-navy-900">{title}</h2>
          <AdminButton variant="ghost" onClick={onClose} aria-label="Close">
            ✕
          </AdminButton>
        </header>
        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
