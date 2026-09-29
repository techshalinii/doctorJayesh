"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, FileText, Plus, TrendingUp } from "lucide-react";
import { listBlogs, type BlogListItem } from "@/lib/admin/api";
import { isVisible } from "@/lib/cms/visibility";
import { normaliseForComparison, scoreMetaDescription, scoreSeoTitle } from "@/lib/cms/seo-score";
import { formatInZone } from "@/lib/admin/timezone";
import { Banner, Panel, StatusBadge } from "@/components/admin/ui";

export default function DashboardPage() {
  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBlogs()
      .then(setPosts)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load posts."))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const live = posts.filter((p) => isVisible(p));
    const upcoming = posts
      .filter((p) => p.status === "scheduled" && !isVisible(p))
      .sort((a, b) => Date.parse(a.publish_at ?? "0") - Date.parse(b.publish_at ?? "0"));
    const drafts = posts.filter((p) => p.status === "draft");

    const countOf = (values: string[]) => {
      const counts = new Map<string, number>();
      for (const value of values) {
        const key = normaliseForComparison(value);
        if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return counts;
    };
    const titleCounts = countOf(posts.map((p) => p.seo_title));
    const descriptionCounts = countOf(posts.map((p) => p.meta_description));
    const repeated = (counts: Map<string, number>, value: string) =>
      (counts.get(normaliseForComparison(value)) ?? 0) > 1 ? [value] : [];

    const scored = posts
      .filter((p) => p.status !== "archived")
      .map((p) => {
        const ctx = {
          pageTitle: p.title,
          focusKeyword: p.focus_keyword,
          excerpt: p.excerpt,
          otherTitles: repeated(titleCounts, p.seo_title),
          otherDescriptions: repeated(descriptionCounts, p.meta_description),
        };
        const title = scoreSeoTitle(p.seo_title, ctx).score;
        const description = scoreMetaDescription(p.meta_description, ctx).score;
        return { post: p, score: Math.round((title + description) / 2) };
      })
      .sort((a, b) => a.score - b.score);

    return { live, upcoming, drafts, weakest: scored.filter((s) => s.score < 80).slice(0, 5) };
  }, [posts]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-navy-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted">
            The CMS holds {posts.length} post{posts.length === 1 ? "" : "s"}, alongside 180 migrated
            articles served from <code className="text-xs">content/</code>.
          </p>
        </div>
        <Link
          href="/admin/blogs/new/"
          className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" /> New post
        </Link>
      </header>

      {error && (
        <div className="mt-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Live now" value={stats.live.length} icon={FileText} />
            <Stat label="Scheduled" value={stats.upcoming.length} icon={CalendarClock} />
            <Stat label="Drafts" value={stats.drafts.length} icon={FileText} />
            <Stat label="Needing SEO work" value={stats.weakest.length} icon={TrendingUp} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Going out next">
              {stats.upcoming.length === 0 ? (
                <p className="text-sm text-muted">Nothing scheduled.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {stats.upcoming.slice(0, 6).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3">
                      <Link
                        href={`/admin/blogs/${p.id}/`}
                        className="min-w-0 flex-1 truncate text-sm text-navy-900 hover:text-teal-700"
                      >
                        {p.title || "(untitled)"}
                      </Link>
                      <span className="shrink-0 text-xs text-muted">
                        {formatInZone(p.publish_at, p.time_zone)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Weakest search metadata">
              {stats.weakest.length === 0 ? (
                <p className="text-sm text-muted">
                  Every post scores 80 or above on both the SEO title and the meta description.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {stats.weakest.map(({ post, score }) => (
                    <li key={post.id} className="flex items-center justify-between gap-3">
                      <Link
                        href={`/admin/blogs/${post.id}/`}
                        className="min-w-0 flex-1 truncate text-sm text-navy-900 hover:text-teal-700"
                      >
                        {post.title || "(untitled)"}
                      </Link>
                      <span className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={post.status} live={isVisible(post)} />
                        <span
                          className={
                            score < 50 ? "text-xs font-semibold text-red-700" : "text-xs font-semibold text-amber-700"
                          }
                        >
                          {score}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 font-display text-3xl font-medium text-navy-900">{value}</p>
    </div>
  );
}
