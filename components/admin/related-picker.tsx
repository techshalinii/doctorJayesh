"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Trash2, X } from "lucide-react";
import { isVisible } from "@/lib/cms/visibility";
import type { BlogRow } from "@/lib/cms/types";
import { AdminButton, Input } from "@/components/admin/ui";

/**
 * "Related in this series" — an ordered list of slugs.
 *
 * Searches BOTH sources: posts written in the CMS and the 180 migrated markdown
 * articles. A new post about disc surgery should be able to point at the migrated
 * article on the same topic; restricting the picker to CMS rows would have made the
 * two halves of the blog invisible to each other.
 *
 * Order is preserved because it is the order they render in.
 */

export interface RelatedCandidate {
  slug: string;
  title: string;
  /** ISO date used for "latest" ordering. */
  date: string;
  category?: string;
  source: "cms" | "migrated";
  /** Whether it is currently public. Migrated posts always are. */
  live: boolean;
}

export function toCandidates(cms: BlogRow[], migrated: RelatedCandidate[]): RelatedCandidate[] {
  const fromCms: RelatedCandidate[] = cms.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.publish_at ?? p.created_at,
    category: p.category,
    source: "cms",
    live: isVisible(p),
  }));
  // Migrated slugs win a clash, matching lib/cms/public.ts.
  const owned = new Set(migrated.map((m) => m.slug));
  return [...migrated, ...fromCms.filter((c) => !owned.has(c.slug))];
}

export function RelatedPicker({
  value,
  onChange,
  candidates,
  currentSlug,
  category,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  candidates: RelatedCandidate[];
  currentSlug: string;
  category: string;
}) {
  const [query, setQuery] = useState("");

  const bySlug = useMemo(
    () => new Map(candidates.map((c) => [c.slug, c])),
    [candidates],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return candidates
      .filter((c) => c.slug !== currentSlug && !value.includes(c.slug))
      .filter((c) => `${c.title} ${c.slug}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, candidates, value, currentSlug]);

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  /**
   * Fill from the chosen category's four most recent posts — published OR scheduled.
   *
   * Scheduled ones are included on purpose: by the time this post is read, a post
   * scheduled for tomorrow is part of the series. They resolve to a live link by then,
   * and until then the article page simply cannot find them and shows fewer.
   */
  const autoAdd = () => {
    const latest = candidates
      .filter((c) => c.slug !== currentSlug)
      .filter((c) => (category ? c.category === category : true))
      .sort((a, b) => Date.parse(b.date || "0") - Date.parse(a.date || "0"))
      .slice(0, 4)
      .map((c) => c.slug);

    // Appended, not replaced — the author's own picks keep their position at the top.
    onChange([...value, ...latest.filter((slug) => !value.includes(slug))].slice(0, 8));
  };

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ol className="flex flex-col gap-1.5">
          {value.map((slug, i) => {
            const match = bySlug.get(slug);
            return (
              <li
                key={slug}
                className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5"
              >
                <span className="w-4 shrink-0 text-xs text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-navy-900">{match?.title ?? slug}</p>
                  <p className="truncate text-xs text-muted">
                    /{slug}/
                    {!match && " · not found — this link will be skipped"}
                    {match && !match.live && " · not public yet"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center">
                  <AdminButton
                    variant="ghost"
                    className="!px-1.5 !py-1"
                    title="Move up"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    className="!px-1.5 !py-1"
                    title="Move down"
                    disabled={i === value.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    className="!px-1.5 !py-1 hover:!bg-red-50 hover:!text-red-700"
                    title="Remove"
                    onClick={() => onChange(value.filter((s) => s !== slug))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </AdminButton>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all posts by title or slug"
            aria-label="Search posts to relate"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-navy-900"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <AdminButton onClick={autoAdd} title="Add the latest posts from this category">
          <Sparkles className="h-4 w-4" /> Auto-add latest
        </AdminButton>
      </div>

      {results.length > 0 && (
        <ul className="rounded-md border border-border">
          {results.map((c) => (
            <li key={c.slug} className="border-b border-border last:border-b-0">
              <button
                onClick={() => {
                  onChange([...value, c.slug]);
                  setQuery("");
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-surface"
              >
                <span className="text-sm text-navy-900">{c.title}</span>
                <span className="text-xs text-muted">
                  /{c.slug}/ · {c.source === "migrated" ? "migrated article" : "CMS post"}
                  {!c.live && " · not public yet"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
