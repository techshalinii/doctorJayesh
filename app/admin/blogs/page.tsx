"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArchiveRestore,
  ArchiveX,
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  archivePost,
  deleteBlog,
  duplicateBlog,
  listBlogs,
  listCategories,
  publishNow,
  revalidate,
  unarchivePost,
} from "@/lib/admin/api";
import { isVisible } from "@/lib/cms/visibility";
import { formatDateTimeParts } from "@/lib/admin/timezone";
import type { BlogRow, BlogStatus, CategoryRow } from "@/lib/cms/types";
import { AdminButton, Banner, Input, Select, StatusBadge } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/**
 * The post list.
 *
 * Sorted by publish date descending by default, never by `updated_at` — see the note on
 * `listBlogs()`. Columns drop out progressively as the viewport narrows rather than
 * wrapping, and whatever is left still scrolls sideways if it has to, so a header or a
 * date never breaks across two lines.
 */

type SortKey = "publish_at" | "title" | "updated_at" | "status" | "read_time";

const TABS: { key: "all" | BlogStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "scheduled", label: "Scheduled" },
  { key: "draft", label: "Draft" },
  { key: "archived", label: "Archived" },
];

export default function BlogListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [tab, setTab] = useState<"all" | BlogStatus>("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "publish_at",
    dir: "desc",
  });

  const apply = useCallback(([blogs, cats]: [BlogRow[], CategoryRow[]]) => {
    setPosts(blogs);
    setCategories(cats);
    setError(null);
  }, []);

  /** Refetch after a row action. The table keeps its current rows meanwhile. */
  const load = useCallback(
    () =>
      Promise.all([listBlogs(), listCategories()])
        .then(apply)
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load posts.")),
    [apply],
  );

  useEffect(() => {
    // `alive` stops a slow response from setting state on an unmounted page, and the
    // promise form keeps every update off the effect's synchronous path.
    let alive = true;
    Promise.all([listBlogs(), listCategories()])
      .then((data) => {
        if (alive) apply(data);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not load posts.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [apply]);

  const counts = useMemo(() => {
    const map = new Map<string, number>([["all", posts.length]]);
    for (const p of posts) map.set(p.status, (map.get(p.status) ?? 0) + 1);
    return map;
  }, [posts]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = posts.filter((p) => {
      if (tab !== "all" && p.status !== tab) return false;
      if (category !== "all" && p.category !== category) return false;
      if (q && !`${p.title} ${p.slug} ${p.focus_keyword}`.toLowerCase().includes(q)) return false;
      return true;
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sort.key) {
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "read_time":
          return (a.read_time - b.read_time) * dir;
        case "updated_at":
          return (Date.parse(a.updated_at || "0") - Date.parse(b.updated_at || "0")) * dir;
        case "publish_at":
        default: {
          // Unscheduled drafts have no date; they sort to the end either way rather
          // than being treated as 1970.
          const av = a.publish_at ? Date.parse(a.publish_at) : null;
          const bv = b.publish_at ? Date.parse(b.publish_at) : null;
          if (av === null && bv === null) return 0;
          if (av === null) return 1;
          if (bv === null) return -1;
          return (av - bv) * dir;
        }
      }
    });
  }, [posts, tab, category, query, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  const act = async (id: string, run: () => Promise<unknown>, slugs: string[]) => {
    setBusyId(id);
    setError(null);
    try {
      await run();
      await revalidate(slugs);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (post: BlogRow) => {
    const live = isVisible(post);
    const message = live
      ? `“${post.title}” is LIVE at /${post.slug}/. Deleting it will make that URL 404 for anyone who has linked to or bookmarked it.\n\nType the slug to confirm.`
      : `Delete “${post.title}”? This cannot be undone.`;

    // A live post takes a typed confirmation, not a click. The cost of an accidental
    // delete is an indexed URL going to 404, which is not recoverable by undo.
    if (live) {
      const typed = window.prompt(message);
      if (typed !== post.slug) return;
    } else if (!window.confirm(message)) {
      return;
    }
    await act(post.id, () => deleteBlog(post.id), [post.slug]);
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-navy-900">Posts</h1>
          <p className="mt-0.5 text-sm text-muted">
            {posts.length} in the CMS. The 180 migrated articles live in{" "}
            <code className="text-xs">content/</code> and are not editable here.
          </p>
        </div>
        <div className="flex gap-2">
          <AdminButton onClick={() => router.push("/admin/blogs/new/?import=1")}>
            <Upload className="h-4 w-4" /> Import Markdown
          </AdminButton>
          <AdminButton variant="primary" onClick={() => router.push("/admin/blogs/new/")}>
            <Plus className="h-4 w-4" /> New post
          </AdminButton>
        </div>
      </header>

      {error && (
        <div className="mt-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      {/* filters */}
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-navy-900 text-white"
                  : "text-muted hover:bg-white hover:text-navy-900",
              )}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-70">{counts.get(t.key) ?? 0}</span>
            </button>
          ))}
        </div>

        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="!w-auto min-w-40"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>

        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, slug, keyword"
            aria-label="Search posts"
            className="pl-8"
          />
        </div>
      </div>

      {/* table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
              <Th onClick={() => toggleSort("title")} sort={sort} k="title">
                Title
              </Th>
              <Th className="hidden lg:table-cell">Category</Th>
              <Th onClick={() => toggleSort("status")} sort={sort} k="status">
                Status
              </Th>
              <Th onClick={() => toggleSort("publish_at")} sort={sort} k="publish_at">
                Publish date
              </Th>
              <Th
                onClick={() => toggleSort("updated_at")}
                sort={sort}
                k="updated_at"
                className="hidden xl:table-cell"
              >
                Updated
              </Th>
              <Th className="hidden 2xl:table-cell">Created by</Th>
              <Th
                onClick={() => toggleSort("read_time")}
                sort={sort}
                k="read_time"
                className="hidden md:table-cell"
              >
                Read
              </Th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-muted">
                  {posts.length === 0
                    ? "No posts yet. Create one, or import a Markdown draft."
                    : "No posts match these filters."}
                </td>
              </tr>
            )}

            {rows.map((post) => {
              const live = isVisible(post);
              const publish = formatDateTimeParts(post.publish_at, post.time_zone);
              const updated = formatDateTimeParts(post.updated_at, post.time_zone);
              const busy = busyId === post.id;

              return (
                <tr key={post.id} className="border-b border-border last:border-b-0 hover:bg-surface/60">
                  <td className="max-w-[22rem] px-3 py-3">
                    <Link
                      href={`/admin/blogs/${post.id}/`}
                      className="font-medium text-navy-900 hover:text-teal-700"
                    >
                      {post.title || <span className="text-muted">(untitled)</span>}
                    </Link>
                    <div className="truncate text-xs text-muted">/{post.slug}/</div>
                  </td>

                  <td className="hidden whitespace-nowrap px-3 py-3 text-muted lg:table-cell">
                    {post.category || "—"}
                  </td>

                  <td className="whitespace-nowrap px-3 py-3">
                    <StatusBadge status={post.status} live={live} />
                  </td>

                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="text-navy-900">{publish.date}</div>
                    <div className="text-xs text-muted">{publish.time}</div>
                  </td>

                  <td className="hidden whitespace-nowrap px-3 py-3 xl:table-cell">
                    <div className="text-muted">{updated.date}</div>
                    <div className="text-xs text-muted">{updated.time}</div>
                  </td>

                  <td className="hidden max-w-[12rem] truncate whitespace-nowrap px-3 py-3 text-xs text-muted 2xl:table-cell">
                    {post.created_by_email || "—"}
                  </td>

                  <td className="hidden whitespace-nowrap px-3 py-3 text-muted md:table-cell">
                    {post.read_time} min
                  </td>

                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <div className="inline-flex items-center gap-0.5">
                      <IconAction
                        title="Edit"
                        onClick={() => router.push(`/admin/blogs/${post.id}/`)}
                        icon={Pencil}
                      />
                      {live && (
                        <IconAction
                          title="Preview on the site"
                          href={`/${post.slug}/`}
                          icon={ExternalLink}
                        />
                      )}
                      <IconAction
                        title="Duplicate"
                        disabled={busy}
                        onClick={() => act(post.id, () => duplicateBlog(post.id), [])}
                        icon={Copy}
                      />
                      {post.status !== "published" && post.status !== "archived" && (
                        <AdminButton
                          variant="ghost"
                          className="!px-2 !py-1 text-xs"
                          disabled={busy}
                          // No confirmation dialog, by design — publishing is the
                          // ordinary action here and is fully reversible by archiving.
                          onClick={() => act(post.id, () => publishNow(post), [post.slug])}
                        >
                          Publish
                        </AdminButton>
                      )}
                      {post.status === "archived" ? (
                        <IconAction
                          title="Unarchive (returns to draft)"
                          disabled={busy}
                          onClick={() => act(post.id, () => unarchivePost(post), [post.slug])}
                          icon={ArchiveRestore}
                        />
                      ) : (
                        <IconAction
                          title="Archive"
                          disabled={busy}
                          onClick={() => act(post.id, () => archivePost(post), [post.slug])}
                          icon={ArchiveX}
                        />
                      )}
                      <IconAction
                        title="Delete"
                        danger
                        disabled={busy}
                        onClick={() => onDelete(post)}
                        icon={Trash2}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  sort,
  k,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  sort?: { key: SortKey; dir: "asc" | "desc" };
  k?: SortKey;
  className?: string;
}) {
  const active = sort && k && sort.key === k;
  return (
    <th className={cn("whitespace-nowrap px-3 py-2.5 font-semibold", className)}>
      {onClick ? (
        <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-navy-900">
          {children}
          {active &&
            (sort.dir === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUp className="h-3 w-3" />
            ))}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

function IconAction({
  title,
  icon: Icon,
  onClick,
  href,
  disabled,
  danger,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  const className = cn(
    "inline-flex rounded-md p-1.5 transition-colors",
    danger ? "text-muted hover:bg-red-50 hover:text-red-700" : "text-muted hover:bg-surface hover:text-navy-900",
    disabled && "pointer-events-none opacity-40",
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" title={title} aria-label={title} className={className}>
        <Icon className="h-4 w-4" />
      </a>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} title={title} aria-label={title} className={className}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
