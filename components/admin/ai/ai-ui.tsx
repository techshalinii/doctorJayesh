"use client";

import { AlertTriangle, Check, CircleDashed, Copy, Loader2, MinusCircle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AI_ESTIMATE_BADGE, AI_ESTIMATE_DISCLAIMER } from "@/lib/ai/labels";
import type { JobStep } from "@/lib/ai/pipeline";
import type { DuplicateMatch, ImageSuggestion, ReviewFinding } from "@/lib/ai/types";

const STEP_ICON = {
  pending: <CircleDashed className="h-4 w-4 text-slate-300" aria-hidden />,
  running: <Loader2 className="h-4 w-4 animate-spin text-navy-700" aria-hidden />,
  done: <Check className="h-4 w-4 text-emerald-600" aria-hidden />,
  failed: <X className="h-4 w-4 text-red-600" aria-hidden />,
  skipped: <MinusCircle className="h-4 w-4 text-slate-400" aria-hidden />,
} as const;

export function JobProgress({ steps, busy }: { steps: JobStep[]; busy: boolean }) {
  return (
    <ul className="flex flex-col gap-2" aria-live="polite" aria-busy={busy}>
      {steps.map((step) => (
        <li key={step.key} className="flex items-start gap-2.5 text-sm">
          <span className="mt-0.5 shrink-0">{STEP_ICON[step.state]}</span>
          <span className="min-w-0">
            <span
              className={cn(
                step.state === "done" && "text-navy-900",
                step.state === "running" && "font-medium text-navy-900",
                step.state === "pending" && "text-slate-400",
                step.state === "failed" && "text-red-700",
                step.state === "skipped" && "text-slate-500",
              )}
            >
              {step.label}
            </span>
            {step.note && <span className="block text-xs text-muted">{step.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AiEstimate({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-violet-50 px-2 py-0.5 text-[0.68rem] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200"
      title={AI_ESTIMATE_DISCLAIMER}
    >
      {AI_ESTIMATE_BADGE} {Math.round(value)}
    </span>
  );
}

export function SourceBadge({ source }: { source: "ai" | "manual" | "markdown" }) {
  const styles = {
    ai: "bg-violet-50 text-violet-700 ring-violet-200",
    manual: "bg-slate-100 text-slate-600 ring-slate-200",
    markdown: "bg-sky-50 text-sky-700 ring-sky-200",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider ring-1 ring-inset",
        styles[source],
      )}
    >
      {source}
    </span>
  );
}

export function ReviewBadge({ state }: { state: "pending" | "clean" | "flagged" | "approved" }) {
  const styles = {
    pending: "bg-slate-100 text-slate-600 ring-slate-200",
    clean: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    flagged: "bg-amber-50 text-amber-800 ring-amber-200",
    approved: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  } as const;
  const label = { pending: "Needs review", clean: "No flags", flagged: "Needs verification", approved: "Approved" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ring-1 ring-inset",
        styles[state],
      )}
    >
      {state === "flagged" && <AlertTriangle className="h-3 w-3" aria-hidden />}
      {label[state]}
    </span>
  );
}

export function DuplicateWarning({
  matches,
  onUseDifferent,
  onContinue,
}: {
  matches: DuplicateMatch[];
  onUseDifferent?: () => void;
  onContinue?: () => void;
}) {
  if (!matches.length) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
      <p className="font-semibold">Similar existing content found.</p>
      <ul className="mt-2 flex flex-col gap-2">
        {matches.map((match) => (
          <li key={`${match.source}-${match.slug}`} className="leading-relaxed">
            <a
              href={match.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-2"
            >
              {match.title}
            </a>
            <span className="ml-1.5 text-xs opacity-80">
              {match.url} · {match.source} · {Math.round(match.score * 100)}% overlap
            </span>
            <span className="block text-xs opacity-90">{match.reason}</span>
          </li>
        ))}
      </ul>
      {(onUseDifferent || onContinue) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onUseDifferent && (
            <button
              onClick={onUseDifferent}
              className="rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-amber-100"
            >
              Use a different topic
            </button>
          )}
          {onContinue && (
            <button
              onClick={onContinue}
              className="rounded-md border border-amber-300 px-2.5 py-1.5 text-xs font-medium hover:bg-amber-100"
            >
              Continue anyway
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function FindingList({
  title,
  findings,
  error,
  emptyLabel,
}: {
  title: string;
  findings: ReviewFinding[] | null;
  error?: string;
  emptyLabel: string;
}) {
  if (error) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
        <p className="mt-1 text-sm text-amber-800">Did not run: {error}</p>
      </div>
    );
  }

  if (!findings) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
        <p className="mt-1 text-sm text-muted">Not run.</p>
      </div>
    );
  }

  if (!findings.length) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-700">
          <Check className="h-4 w-4" aria-hidden /> {emptyLabel}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-navy-900">
        {title} <span className="font-normal text-muted">({findings.length})</span>
      </h3>
      <ol className="mt-2 flex flex-col gap-3">
        {findings.map((finding, i) => (
          <li key={i} className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
            <p className="font-medium text-navy-900">{finding.issue}</p>
            {finding.excerpt && (
              <p className="mt-1 border-l-2 border-amber-300 pl-2 text-xs italic text-muted">
                “{finding.excerpt}”
              </p>
            )}
            {finding.suggestion && <p className="mt-1 text-xs text-muted">{finding.suggestion}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ImageSuggestionCard({ image }: { image: ImageSuggestion }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(image.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-md border border-border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {image.role === "featured" ? "Featured image" : "Supporting image"}
          </p>
          <p className="mt-0.5 text-sm font-medium text-navy-900">{image.concept}</p>
        </div>
        <button
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-surface"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden /> {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
        {[
          ["Subject", image.subject],
          ["Setting", image.setting],
          ["Composition", image.composition],
          ["Lighting", image.lighting],
          ["Style", image.visualStyle],
          ["Ratio", image.aspectRatio],
          ["Text", image.includeText ? "Yes" : "No text"],
          ["Placement", image.placement],
        ]
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt className="inline font-medium text-slate-600">{label}: </dt>
              <dd className="inline">{value}</dd>
            </div>
          ))}
      </dl>

      <p className="mt-2 whitespace-pre-wrap rounded bg-surface p-2 font-mono text-[0.72rem] leading-relaxed text-slate-700">
        {image.prompt}
      </p>
      <p className="mt-1.5 text-xs text-muted">
        <span className="font-medium text-slate-600">Alt text:</span> {image.altText}
      </p>
    </div>
  );
}
