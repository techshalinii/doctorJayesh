"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import type { PostSummary } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";



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
          <ArrowUpRight className="h-4 w-4 text-teal-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-teal-400" />
        </div>
      </div>
    </Link>
  );
}

export function PostsExplorer({
  posts: allPosts,
  limit,
  showFeatured = true,
  showControls = true,
}: {
  posts: PostSummary[];
  limit?: number;
  showFeatured?: boolean;
  /** The homepage teaser renders a fixed 3 posts, so the filter + search row is dead weight there. */
  showControls?: boolean;
}) {
  // Derived from the posts themselves — migrated WordPress content carries no real
  // categories (everything was "uncategorized"), so only "All" renders for now.
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(allPosts.map((p) => p.category).filter(Boolean) as string[]))],
    [allPosts],
  );
  const [active, setActive] = useState<string>("All");
  const [query, setQuery] = useState("");

  const featured = showFeatured ? allPosts.find((p) => p.featured) : undefined;

  const filtered = useMemo(() => {
    let list = allPosts.filter((p) => (featured ? p.slug !== featured.slug : true));
    if (active !== "All") list = list.filter((p) => p.category === active);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
    }
    return limit ? list.slice(0, limit) : list;
  }, [allPosts, active, query, featured, limit]);

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
              <ArrowRight className="h-4 w-4 text-teal-600 transition-transform group-hover:translate-x-1 dark:text-teal-400" />
            </span>
          </div>
        </Link>
      )}

      {/* controls — minimal text toggles */}
      <div className={cn("mb-2 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between", showControls ? "flex" : "hidden")}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={cn(
                "border-b-2 pb-1 text-sm font-medium transition-colors",
                active === c
                  ? "border-teal-500 text-navy-900 dark:text-white"
                  : "border-transparent text-muted hover:text-navy-800 dark:hover:text-white",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative sm:w-60">
          <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles"
            aria-label="Search articles"
            className="w-full border-b border-border bg-transparent py-2 pl-7 pr-2 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-teal-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="border-t border-border py-20 text-center text-muted">No articles match your search.</p>
      ) : (
        <div className={cn("grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3", showControls ? "mt-8" : "mt-0")}>
          {filtered.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 0.06}>
              <PostCard post={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
