"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, RefreshCw, ShieldCheck } from "lucide-react";
import { AdminButton, Banner, Panel } from "@/components/admin/ui";
import { FindingList, ImageSuggestionCard, ReviewBadge } from "./ai-ui";
import { approveBlog, getAiMetadata, reviewBlog, type BlogAiMetadata } from "@/lib/admin/ai-api";
import { formatInZone } from "@/lib/admin/timezone";
import type { ReviewFinding } from "@/lib/ai/types";

export function AiPanel({ blogId, body }: { blogId: string; body: string }) {
  const [meta, setMeta] = useState<BlogAiMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getAiMetadata(blogId)
      .then((found) => {
        if (alive) setMeta(found);
      })
      .catch(() => {
        if (alive) setMeta(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [blogId]);

  const rerun = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { review } = await reviewBlog({ body, blogId });
      setMeta((prev) =>
        prev
          ? {
              ...prev,
              medical_review: review.medical.length ? "flagged" : "clean",
              medical_findings: review.medical as ReviewFinding[],
              style_findings: [...review.style, ...review.originality, ...review.language] as ReviewFinding[],
              grammar_findings: review.grammar as ReviewFinding[],
            }
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "The review failed.");
    } finally {
      setBusy(false);
    }
  }, [body, blogId]);

  const approve = useCallback(async () => {
    if (!meta) return;
    setBusy(true);
    setError(null);
    try {
      await approveBlog(blogId, !meta.approved);
      setMeta({ ...meta, approved: !meta.approved, medical_review: !meta.approved ? "approved" : "flagged" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record approval.");
    } finally {
      setBusy(false);
    }
  }, [meta, blogId]);

  if (loading || !meta) return null;

  return (
    <>
      <Panel
        title="AI generation"
        action={<ReviewBadge state={meta.medical_review} />}
      >
        <div className="flex flex-col gap-3 text-sm">
          <p className="flex items-start gap-2 text-xs text-muted">
            <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Generated with {meta.provider}
              {meta.model ? ` · ${meta.model}` : ""}
              <br />
              {formatInZone(meta.generated_at)}
              {meta.prompt_version ? ` · prompts ${meta.prompt_version}` : ""}
              {meta.generation_type === "monthly" ? " · monthly batch" : ""}
            </span>
          </p>

          {error && <Banner tone="error">{error}</Banner>}

          <FindingList
            title="Medical review"
            findings={meta.medical_findings as ReviewFinding[]}
            emptyLabel="No obvious unsupported claims detected"
          />
          <FindingList
            title="Style & originality"
            findings={meta.style_findings as ReviewFinding[]}
            emptyLabel="Consistent with the house style"
          />
          <FindingList
            title="Grammar"
            findings={meta.grammar_findings as ReviewFinding[]}
            emptyLabel="No mechanical errors found"
          />

          <div className="flex flex-col gap-2">
            <AdminButton onClick={() => void rerun()} disabled={busy}>
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Re-run checks
            </AdminButton>
            <AdminButton variant={meta.approved ? "secondary" : "primary"} onClick={() => void approve()} disabled={busy}>
              <ShieldCheck className="h-4 w-4" />
              {meta.approved ? "Reviewed — undo" : "Mark reviewed"}
            </AdminButton>
            <p className="text-xs text-muted">
              A note for your own records. It does not publish anything and it does not
              change when this post goes live.
            </p>
          </div>

          {meta.external_source_suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-navy-900">Sources to verify</h3>
              <ul className="mt-1 flex list-disc flex-col gap-1 pl-4 text-xs text-muted">
                {meta.external_source_suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      </Panel>

      {meta.image_suggestions.length > 0 && (
        <Panel title="Image prompts">
          <p className="mb-3 text-xs text-muted">
            Copy a prompt, make the image in your own tool, then upload it with the featured
            image picker above. Nothing here creates an image file.
          </p>
          <div className="flex flex-col gap-3">
            {meta.image_suggestions.map((image, i) => (
              <ImageSuggestionCard key={i} image={image} />
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
