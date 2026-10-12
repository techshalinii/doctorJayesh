"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import type { PostSummary } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import { BLOG_CATEGORIES } from "@/lib/blog-categories";
import { Arrow } from "@/components/ui/arrow";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link href={`/${post.slug}/`} className="group flex h-full flex-col">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col pt-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
          <span className="text-teal-700 dark:text-teal-300">{post.category}</span>
          <span className="text-navy-300 dark:text-white/30">·</span>
          <span>{post.readingTime}</span>
        </div>
        <h3 className="mt-3 flex-1 font-display text-lg font-medium leading-snug text-navy-900 transition-colors group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <span>{formatDate(post.date)}</span>
          <Arrow className="text-teal-600 dark:text-teal-400" />
        </div>
      </div>
    </Link>
  );
}

function pageList(current: number, total: number): (number | "gap")[] {
  const wanted = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (const [i, n] of pages.entries()) {
    if (i > 0 && n - pages[i - 1] > 1) out.push(n - pages[i - 1] === 2 ? n - 1 : "gap");
    out.push(n);
  }
  return out;
}

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pill =
    "inline-flex h-9 items-center justify-center rounded-full bg-surface-2 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-900 hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-navy-950";

  return (
    <nav aria-label="Blog pages" className="mt-12 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        aria-label="Previous page"
        className={cn(pill, "gap-1.5 px-3 sm:px-4 disabled:pointer-events-none disabled:opacity-50")}
      >
        <Arrow direction="left" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <ol className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {pageList(current, total).map((item, i) =>
          item === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="w-5 text-center text-sm text-navy-900 dark:text-white">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === current ? "page" : undefined}
                className={cn(
                  pill,
                  "w-9 tabular-nums",
                  item === current && "bg-navy-900 text-white dark:bg-white dark:text-navy-950",
                )}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        aria-label="Next page"
        className={cn(pill, "gap-1.5 px-3 sm:px-4 disabled:pointer-events-none disabled:opacity-50")}
      >
        <span className="hidden sm:inline">Next</span>
        <Arrow />
      </button>
    </nav>
  );
}

export function PostsExplorer({
  posts: allPosts,
  limit,
  showFeatured = true,
  showControls = true,
  pageSize,
}: {
  posts: PostSummary[];
  limit?: number;
  showFeatured?: boolean;
  showControls?: boolean;
  pageSize?: number;
}) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allPosts) if (p.category) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, [allPosts]);
  const categories = useMemo(() => {
    const known = new Set<string>(BLOG_CATEGORIES);
    const extra = [...counts.keys()].filter((c) => !known.has(c)).sort();
    return ["All", ...BLOG_CATEGORIES, ...extra];
  }, [counts]);
  const [active, setActive] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const listTop = useRef<HTMLDivElement>(null);

  const unfiltered = active === "All" && !query.trim();
  const featured = showFeatured && unfiltered && page === 1 ? allPosts.find((p) => p.featured) : undefined;

  const filtered = useMemo(() => {
    const pinned = showFeatured && unfiltered ? allPosts.find((p) => p.featured) : undefined;
    let list = allPosts.filter((p) => (pinned ? p.slug !== pinned.slug : true));
    if (active !== "All") list = list.filter((p) => p.category === active);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
    }
    return limit ? list.slice(0, limit) : list;
  }, [allPosts, active, query, showFeatured, unfiltered, limit]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const current = Math.min(page, totalPages);
  const visible = pageSize ? filtered.slice((current - 1) * pageSize, current * pageSize) : filtered;

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    listTop.current?.scrollIntoView({ block: "start" });
  };

  return (
    <div>
      {featured && (
        <Link
          href={`/${featured.slug}/`}
          className="group mb-16 grid gap-8 md:grid-cols-2 md:items-center md:gap-12"
        >
          <div className="relative aspect-[16/11] overflow-hidden bg-surface-2">
            <Image
              src={featured.image}
              alt={featured.title}
              fill
              sizes="(min-width: 768px) 50vw, 90vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute left-4 top-4 rounded-full bg-gold-500 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-navy-950">
              Featured
            </span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-muted">
              {featured.category} · {featured.readingTime}
            </span>
            <h3 className="mt-3 font-display text-2xl font-medium leading-tight text-navy-900 transition-colors group-hover:text-teal-700 sm:text-[2rem] dark:text-white dark:group-hover:text-teal-300">
              {featured.title}
            </h3>
            <p className="mt-4 max-w-2xl text-muted">{featured.excerpt}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-navy-800 dark:text-white/80">
              Read the full article
              <Arrow className="text-teal-600 dark:text-teal-400" />
            </span>
          </div>
        </Link>
      )}

      <div ref={listTop} className={cn("mb-2 flex-col gap-5", showControls ? "flex" : "hidden")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
            Browse by topic
          </h2>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search articles"
              aria-label="Search articles"
              className="w-full border-b border-border bg-transparent py-2 pl-7 pr-2 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-teal-500"
            />
          </div>
        </div>

        <div role="group" aria-label="Filter articles by category" className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const isActive = active === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setActive(c);
                  setPage(1);
                }}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-navy-900 text-white dark:bg-white dark:text-navy-950"
                    : "bg-surface-2 text-navy-900 hover:bg-navy-100 dark:text-white/85 dark:hover:bg-white/10",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="border-t border-border py-20 text-center text-muted">No articles match your search.</p>
      ) : (
        <div className={cn("grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3", showControls ? "mt-8" : "mt-0")}>
          {visible.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 0.06}>
              <PostCard post={p} />
            </Reveal>
          ))}
        </div>
      )}

      {pageSize && totalPages > 1 && (
        <>
          <Pagination current={current} total={totalPages} onChange={goToPage} />
          <p className="mt-3 text-center text-xs text-muted tabular-nums">
            Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, filtered.length)} of {filtered.length} articles
          </p>
        </>
      )}
    </div>
  );
}
