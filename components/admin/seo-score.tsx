"use client";

import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import {
  BAND_LABEL,
  scoreMetaDescription,
  scoreSeoTitle,
  type ScoreBand,
  type ScoreContext,
  type ScoreResult,
} from "@/lib/cms/seo-score";
import {
  suggestMetaDescriptions,
  suggestSeoTitles,
  type SuggestOption,
} from "@/lib/cms/seo-suggest";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AdminButton, Banner, Modal } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/**
 * Live SEO score for the SEO title and meta description, with a Suggest panel.
 *
 * The score is computed locally on every keystroke by lib/cms/seo-score.ts — it is pure
 * and rule-based, so there is no request to wait for and no chance of the number
 * disagreeing with the checklist under it.
 *
 * Suggest is where a model may be involved, and only for wording. Options come back
 * already scored by the same rules, and the panel shows each one's length and per-rule
 * ticks, so the author is never asked to trust a suggestion on the basis that it was
 * generated.
 */

const BAND_STYLES: Record<ScoreBand, { ring: string; text: string; bar: string }> = {
  good: { ring: "ring-emerald-200 bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  "needs-work": { ring: "ring-amber-200 bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  poor: { ring: "ring-red-200 bg-red-50", text: "text-red-700", bar: "bg-red-500" },
};

export function SeoScore({
  kind,
  value,
  context,
  onApply,
}: {
  kind: "title" | "description";
  value: string;
  context: ScoreContext;
  onApply: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const score = kind === "title" ? scoreSeoTitle(value, context) : scoreMetaDescription(value, context);
  const style = BAND_STYLES[score.band];
  const inRange = score.length >= score.ideal.min && score.length <= score.ideal.max;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
            style.ring,
            style.text,
          )}
        >
          {score.score}/100 · {BAND_LABEL[score.band]}
        </span>

        <span className={cn("text-xs tabular-nums", inRange ? "text-emerald-700" : "text-muted")}>
          {score.length} / {score.ideal.min}–{score.ideal.max} characters
        </span>

        {score.score < 80 && (
          <AdminButton variant="ghost" className="ml-auto !px-2 !py-1 text-xs" onClick={() => setOpen(true)}>
            <Sparkles className="h-3.5 w-3.5" /> Suggest
          </AdminButton>
        )}
      </div>

      {/* One segment per rule, width proportional to what it is worth. Reading the bar
          tells you WHICH points are missing, not just how many. */}
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        {score.rules.map((rule) => (
          <div
            key={rule.id}
            style={{ width: `${rule.max}%` }}
            title={`${rule.label} — ${rule.points}/${rule.max}`}
            className={cn(
              "h-full border-r border-white/70 last:border-r-0",
              rule.points === rule.max
                ? style.bar
                : rule.points > 0
                  ? "bg-amber-300"
                  : "bg-transparent",
            )}
          />
        ))}
      </div>

      <RuleList score={score} />

      {open && (
        <SuggestModal
          kind={kind}
          score={score}
          context={context}
          onClose={() => setOpen(false)}
          onApply={(next) => {
            onApply(next);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function RuleList({ score }: { score: ScoreResult }) {
  return (
    <ul className="flex flex-col gap-1">
      {score.rules.map((rule) => (
        <li key={rule.id} className="flex items-start gap-1.5 text-xs leading-relaxed">
          {rule.passed ? (
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
          ) : (
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          )}
          <span className={rule.passed ? "text-muted" : "text-navy-800"}>
            {rule.label}
            {!rule.passed && (
              <span className="text-muted">
                {" — "}
                {rule.needsKeyword
                  ? "add a focus keyword to score keyword rules"
                  : rule.problem}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ── the Suggest panel ──────────────────────────────────────────────────────── */

function SuggestModal({
  kind,
  score,
  context,
  onClose,
  onApply,
}: {
  kind: "title" | "description";
  score: ScoreResult;
  context: ScoreContext;
  onClose: () => void;
  onApply: (next: string) => void;
}) {
  const hasKeyword = Boolean(context.focusKeyword.trim());

  // Templates are computed synchronously so the panel has content the moment it opens;
  // the model call, if there is one, replaces them when it lands.
  const [options, setOptions] = useState<SuggestOption[]>(() =>
    hasKeyword ? (kind === "title" ? suggestSeoTitles(context) : suggestMetaDescriptions(context)) : [],
  );
  const [source, setSource] = useState<"ai" | "template">("template");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const failing = score.rules.filter((r) => !r.passed);

  const askModel = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const { data } = await supabaseBrowser().auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Session expired — sign in again.");

      const response = await fetch("/api/seo-suggest/", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ kind, context }),
      });
      const body = (await response.json()) as {
        source?: "ai" | "template";
        options?: SuggestOption[];
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? "Could not generate suggestions.");

      if (body.options?.length) {
        setOptions(body.options);
        setSource(body.source ?? "template");
        if (body.source !== "ai") {
          setNotice("No model is configured, so these come from the built-in generator.");
        }
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not generate suggestions.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={kind === "title" ? "Improve this SEO title" : "Improve this meta description"}
      onClose={onClose}
      wide
    >
      <div className="flex flex-col gap-6">
        {!hasKeyword && (
          <Banner tone="warn">
            Set a <strong>focus keyword</strong> first. It is the query this post targets, and the
            keyword rules — worth {kind === "title" ? 40 : 25} points — cannot be scored or fixed
            without one. Nothing here will guess it for you.
          </Banner>
        )}

        {/* 1. what is wrong, 2. the rule and why it exists */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-700">
            What&rsquo;s failing
          </h3>
          {failing.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Every rule passes. Nothing to fix.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {failing.map((rule) => (
                <li key={rule.id} className="rounded-md border border-border bg-surface px-3 py-2.5">
                  <p className="text-sm font-medium text-navy-900">
                    {rule.label}{" "}
                    <span className="font-normal text-muted">
                      ({rule.points}/{rule.max} points)
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-navy-800">{rule.problem}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{rule.why}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 3. concrete rewrites, each shown with the evidence for its own claim */}
        {hasKeyword && (
          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-700">
                Rewrite options
                <span className="ml-2 font-normal normal-case tracking-normal text-muted">
                  {source === "ai" ? "model-worded, rule-checked" : "built-in generator"}
                </span>
              </h3>
              <AdminButton variant="secondary" onClick={askModel} disabled={busy}>
                <Sparkles className="h-3.5 w-3.5" />
                {busy ? "Generating…" : "Generate with AI"}
              </AdminButton>
            </div>

            {notice && (
              <div className="mt-3">
                <Banner tone="info">{notice}</Banner>
              </div>
            )}

            <ul className="mt-3 flex flex-col gap-3">
              {options.map((option, i) => (
                <li key={i} className="rounded-md border border-border p-3">
                  <p className="text-sm leading-relaxed text-navy-900">{option.text}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span
                      className={cn(
                        "font-semibold",
                        BAND_STYLES[option.score.band].text,
                      )}
                    >
                      {option.score.score}/100
                    </span>
                    <span className="tabular-nums text-muted">
                      {option.score.length} characters
                    </span>
                    {option.score.rules.map((rule) => (
                      <span
                        key={rule.id}
                        title={rule.label}
                        className={cn(
                          "inline-flex items-center gap-0.5",
                          rule.passed ? "text-emerald-700" : "text-slate-400",
                        )}
                      >
                        {rule.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {rule.label}
                      </span>
                    ))}
                    <AdminButton
                      variant="primary"
                      className="ml-auto !px-2.5 !py-1 text-xs"
                      onClick={() => onApply(option.text)}
                    >
                      Use this
                    </AdminButton>
                  </div>
                </li>
              ))}
              {options.length === 0 && (
                <li className="text-sm text-muted">
                  No options could be generated from the current title and excerpt. Fill those in
                  and try again.
                </li>
              )}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  );
}
