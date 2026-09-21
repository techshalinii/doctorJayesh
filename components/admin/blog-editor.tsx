"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveRestore,
  ArchiveX,
  CalendarClock,
  Eye,
  History,
  Save,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import {
  archivePost,
  createBlog,
  deleteBlog,
  hasBeenLive,
  listBlogs,
  listCategories,
  publishNow,
  revalidate,
  schedulePost,
  unarchivePost,
  updateBlog,
  type BlogInput,
} from "@/lib/admin/api";
import { readTimeFromBlocks } from "@/lib/cms/blocks";
import { isVisible } from "@/lib/cms/visibility";
import { toSlug } from "@/lib/cms/markdown-import";
import { DEFAULT_TIME_ZONE, TIME_ZONES, utcToWallTime, wallTimeToUtc } from "@/lib/admin/timezone";
import type { ImportedPost } from "@/lib/cms/markdown-import";
import type { Block, BlogRow, BlogStatus, CategoryRow, FaqItem } from "@/lib/cms/types";
import type { ScoreContext } from "@/lib/cms/seo-score";
import { siteUrl } from "@/lib/data";
import {
  AdminButton,
  Banner,
  Field,
  Input,
  Panel,
  Select,
  StatusBadge,
  Textarea,
  useEscapeKey,
} from "@/components/admin/ui";
import { RichEditor } from "@/components/admin/rich-editor";
import { SeoScore } from "@/components/admin/seo-score";
import { FaqEditor } from "@/components/admin/faq-editor";
import { RelatedPicker, toCandidates, type RelatedCandidate } from "@/components/admin/related-picker";
import { MarkdownImport } from "@/components/admin/markdown-import";
import { FeaturedImagePicker } from "@/components/admin/media-picker";
import { PreviewModal } from "@/components/admin/preview-modal";
import { VersionHistory } from "@/components/admin/version-history";

/**
 * The post editor.
 *
 * One `form` object holds every field; everything else derives from it. That keeps the
 * autosave, the dirty check and the SEO scoring reading from the same state rather than
 * from a dozen independent pieces that can disagree.
 */

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: Block[];
  featured_image: string | null;
  image_alt: string;
  category: string;
  tags: string;
  author: string;
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
  canonical_url: string;
  faq: FaqItem[];
  related_blogs: string[];
  time_zone: string;
}

function toForm(post: BlogRow | null, defaultAuthor: string): FormState {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? [],
    featured_image: post?.featured_image ?? null,
    image_alt: post?.image_alt ?? "",
    category: post?.category ?? "",
    tags: (post?.tags ?? []).join(", "),
    author: post?.author ?? defaultAuthor,
    seo_title: post?.seo_title ?? "",
    meta_description: post?.meta_description ?? "",
    focus_keyword: post?.focus_keyword ?? "",
    canonical_url: post?.canonical_url ?? "",
    faq: post?.faq ?? [],
    related_blogs: post?.related_blogs ?? [],
    time_zone: post?.time_zone ?? DEFAULT_TIME_ZONE,
  };
}

function toInput(form: FormState): BlogInput {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    excerpt: form.excerpt.trim(),
    content: form.content,
    featured_image: form.featured_image,
    image_alt: form.image_alt.trim(),
    category: form.category,
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    author: form.author.trim(),
    seo_title: form.seo_title.trim(),
    meta_description: form.meta_description.trim(),
    focus_keyword: form.focus_keyword.trim(),
    canonical_url: form.canonical_url.trim() || null,
    faq: form.faq.filter((f) => f.question.trim() && f.answer.trim()),
    related_blogs: form.related_blogs,
    time_zone: form.time_zone,
    read_time: readTimeFromBlocks(form.content),
  };
}

export function BlogEditor({
  post: initialPost,
  migrated,
  reservedSlugs,
  defaultAuthor,
  openImport = false,
}: {
  /** null for a new post. */
  post: BlogRow | null;
  /** The 180 markdown articles, so the related picker can reach them. */
  migrated: RelatedCandidate[];
  /** Root slugs the site already serves from elsewhere — see getReservedSlugs(). */
  reservedSlugs: string[];
  defaultAuthor: string;
  /** Open the Markdown importer on mount — the list links here with `?import=1`. */
  openImport?: boolean;
}) {
  const router = useRouter();

  const [post, setPost] = useState<BlogRow | null>(initialPost);
  const [form, setForm] = useState<FormState>(() => toForm(initialPost, defaultAuthor));
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [allPosts, setAllPosts] = useState<BlogRow[]>([]);

  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showImport, setShowImport] = useState(openImport);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  /** Bumped when the body is replaced wholesale, to reset the uncontrolled editor. */
  const [bodyKey, setBodyKey] = useState(0);
  /**
   * Once the author edits the slug by hand, stop deriving it from the title.
   *
   * State rather than a ref because it drives what renders — whether the field is
   * disabled and whether the Unlock button is shown.
   */
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost));

  const live = post ? isVisible(post) : false;
  const everLive = post ? hasBeenLive(post) : false;
  const status: BlogStatus = post?.status ?? "draft";

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }, []);

  useEffect(() => {
    Promise.all([listCategories(), listBlogs()])
      .then(([cats, blogs]) => {
        setCategories(cats);
        setAllPosts(blogs);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load reference data."));
  }, []);

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const others = useMemo(() => allPosts.filter((p) => p.id !== post?.id), [allPosts, post?.id]);

  const scoreContext: ScoreContext = useMemo(
    () => ({
      pageTitle: form.title,
      focusKeyword: form.focus_keyword,
      excerpt: form.excerpt,
      otherTitles: others.map((p) => p.seo_title).filter(Boolean),
      otherDescriptions: others.map((p) => p.meta_description).filter(Boolean),
    }),
    [form.title, form.focus_keyword, form.excerpt, others],
  );

  const candidates = useMemo(() => toCandidates(allPosts, migrated), [allPosts, migrated]);

  /**
   * A duplicate title or slug is a warning, not a block: the slug is unique-constrained
   * in the database and will fail loudly on save, and a duplicate title is sometimes
   * legitimate. The author should see it before they hit that wall, though.
   */
  const reserved = useMemo(() => new Set(reservedSlugs), [reservedSlugs]);

  const duplicates = useMemo(() => {
    const slug = form.slug.trim().toLowerCase();
    const title = form.title.trim().toLowerCase();
    const messages: string[] = [];

    // Checked against EVERY root slug the site already answers — migrated posts, the
    // migrated pages (brain-tumor, fellowship, surgeries, thank-you…) and the hand-built
    // routes. All of those win over the [slug] segment, so a post here would be listed
    // and submitted to Google while its URL served something else entirely.
    if (slug && reserved.has(slug)) {
      messages.push(
        `/${slug}/ is already served by the existing site, so this post could never appear at it. Choose another slug.`,
      );
    } else if (slug && others.some((p) => p.slug.toLowerCase() === slug)) {
      messages.push(`Another post already uses the slug /${slug}/.`);
    }
    if (title && others.some((p) => p.title.trim().toLowerCase() === title)) {
      messages.push("Another post already has this title.");
    }
    return messages;
  }, [form.slug, form.title, others, reserved]);

  const readTime = readTimeFromBlocks(form.content);

  /* ── saving ──────────────────────────────────────────────────────────────── */

  const save = useCallback(
    async (note = "", silent = false): Promise<BlogRow | null> => {
      const input = toInput(form);
      if (!input.slug) {
        if (!silent) setError("A slug is required before this post can be saved.");
        return null;
      }

      if (!silent) setBusy("save");
      setError(null);
      try {
        const saved = post
          ? await updateBlog(post.id, input, note)
          : await createBlog({ ...input, status: "draft" });

        setPost(saved);
        setDirty(false);
        if (!silent) setNotice("Saved.");

        // A brand-new post gets a real URL, so later autosaves update rather than
        // creating a second row.
        if (!post) router.replace(`/admin/blogs/${saved.id}/`);
        else void revalidate([saved.slug]);

        return saved;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save.");
        return null;
      } finally {
        if (!silent) setBusy(null);
      }
    },
    [form, post, router],
  );

  /**
   * Autosave, every 30 seconds while there are unsaved changes.
   *
   * Only for posts that already exist. On a new post it would create a row the moment
   * someone typed a character and wandered off, and the Posts list would fill with
   * empty drafts — the first save stays a deliberate act.
   *
   * A repeating interval, NOT a timer restarted on each edit. Keying it off the form
   * would reset the countdown on every keystroke, so someone writing steadily for ten
   * minutes — exactly the person autosave exists for — would never be saved at all.
   * `dirty` and `save` are read through refs so the interval is never torn down and
   * rebuilt mid-cycle.
   */
  const saveRef = useRef(save);
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    saveRef.current = save;
    dirtyRef.current = dirty;
  }, [save, dirty]);

  const postId = post?.id;
  useEffect(() => {
    if (!postId) return;
    const interval = setInterval(() => {
      if (!dirtyRef.current) return;
      void saveRef.current("Autosaved", true).then((saved) => {
        if (saved) setNotice(`Autosaved at ${new Date().toLocaleTimeString()}`);
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, [postId]);

  /** Browsers ignore the message, but the prompt itself still appears. */
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /* ── workflow actions ────────────────────────────────────────────────────── */

  const runAction = async (key: string, action: (saved: BlogRow) => Promise<BlogRow>) => {
    setBusy(key);
    setError(null);
    try {
      // Always flush pending edits first: publishing a post whose latest paragraph is
      // still only in the browser is the worst possible surprise.
      const saved = (await save("", true)) ?? post;
      if (!saved) throw new Error("Save the post first.");

      const next = await action(saved);
      setPost(next);
      setForm(toForm(next, defaultAuthor));
      setDirty(false);
      await revalidate([next.slug, ...(next.previous_slugs ?? [])]);
      setNotice(`Done — post is now ${next.status}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async () => {
    if (!post) return;
    const message = live
      ? `“${post.title}” is LIVE at /${post.slug}/. Deleting it makes that URL 404 for anyone who linked to it.\n\nType the slug to confirm.`
      : `Delete “${post.title}”? This cannot be undone.`;

    if (live) {
      if (window.prompt(message) !== post.slug) return;
    } else if (!window.confirm(message)) return;

    setBusy("delete");
    try {
      await deleteBlog(post.id);
      await revalidate([post.slug]);
      router.replace("/admin/blogs/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
      setBusy(null);
    }
  };

  const applyImport = (imported: ImportedPost) => {
    setForm((f) => ({
      ...f,
      title: imported.title || f.title,
      // A live post's URL is not changed by an import.
      slug: everLive ? f.slug : imported.slug || f.slug,
      excerpt: imported.excerpt || f.excerpt,
      content: imported.content,
      featured_image: imported.featured_image ?? f.featured_image,
      image_alt: imported.image_alt || f.image_alt,
      category: imported.category || f.category,
      tags: imported.tags.length ? imported.tags.join(", ") : f.tags,
      author: imported.author || f.author,
      // Taken verbatim from the draft's own SEO-title line, or left as it was. Never
      // derived from the H1 — see lib/cms/markdown-import.ts.
      seo_title: imported.seo_title || f.seo_title,
      meta_description: imported.meta_description || f.meta_description,
      focus_keyword: imported.focus_keyword || f.focus_keyword,
      faq: imported.faq.length ? imported.faq : f.faq,
      related_blogs: imported.related_blogs.length ? imported.related_blogs : f.related_blogs,
    }));
    if (!everLive && imported.slug) setSlugTouched(true);
    setBodyKey((k) => k + 1);
    setDirty(true);
    setShowImport(false);
    setNotice(
      imported.warnings.length
        ? `Imported with ${imported.warnings.length} note${imported.warnings.length === 1 ? "" : "s"} — check the SEO panel.`
        : "Imported.",
    );
  };

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto w-full max-w-7xl pb-24">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-medium text-navy-900">
              {post ? "Edit post" : "New post"}
            </h1>
            {post && <StatusBadge status={status} live={live} />}
            {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
          </div>
          {post && (
            <p className="mt-0.5 truncate text-sm text-muted">
              {siteUrl}/{form.slug || "…"}/ · version {post.version} · {readTime} min read
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <AdminButton onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4" /> Import
          </AdminButton>
          <AdminButton onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" /> Preview
          </AdminButton>
          {post && (
            <AdminButton onClick={() => setShowVersions(true)}>
              <History className="h-4 w-4" /> History
            </AdminButton>
          )}
          <AdminButton onClick={() => void save("Saved draft")} disabled={busy !== null}>
            <Save className="h-4 w-4" /> {busy === "save" ? "Saving…" : "Save draft"}
          </AdminButton>
          <AdminButton onClick={() => setShowSchedule(true)} disabled={busy !== null}>
            <CalendarClock className="h-4 w-4" /> Schedule
          </AdminButton>
          <AdminButton
            variant="primary"
            disabled={busy !== null}
            // No confirmation dialog: publishing is the ordinary action, it is
            // reversible by archiving, and a modal between the author and it just
            // trains them to click through.
            onClick={() => runAction("publish", (saved) => publishNow(saved))}
          >
            <Send className="h-4 w-4" /> {busy === "publish" ? "Publishing…" : "Publish now"}
          </AdminButton>
        </div>
      </header>

      <div className="mt-4 flex flex-col gap-2">
        {error && <Banner tone="error">{error}</Banner>}
        {notice && !error && <Banner tone="success">{notice}</Banner>}
        {duplicates.map((message, i) => (
          <Banner key={i} tone="warn">
            {message}
          </Banner>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ── main column ── */}
        <div className="flex min-w-0 flex-col gap-6">
          <Panel>
            <div className="flex flex-col gap-4">
              <Field label="Title" htmlFor="title">
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((f) => ({
                      ...f,
                      title,
                      slug: slugTouched ? f.slug : toSlug(title),
                    }));
                    setDirty(true);
                  }}
                  placeholder="The article's headline"
                />
              </Field>

              <Field
                label="Slug"
                htmlFor="slug"
                hint={
                  everLive
                    ? "Frozen because this post has been public. Changing it would break an indexed URL — if you must, the old one will 308 to the new one."
                    : "Used as the URL: /slug/. Generated from the title until you edit it."
                }
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm text-muted">/</span>
                  <Input
                    id="slug"
                    value={form.slug}
                    disabled={everLive && !slugTouched}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", toSlug(e.target.value));
                    }}
                  />
                  <span className="shrink-0 text-sm text-muted">/</span>
                  {everLive && !slugTouched && (
                    <AdminButton
                      variant="ghost"
                      className="shrink-0 text-xs"
                      onClick={() => setSlugTouched(true)}
                    >
                      Unlock
                    </AdminButton>
                  )}
                </div>
              </Field>

              <Field label="Excerpt" htmlFor="excerpt" hint="Shown on the blog listing and above the article.">
                <Textarea
                  id="excerpt"
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Body">
            <RichEditor value={form.content} resetKey={bodyKey} onChange={(c) => set("content", c)} />
          </Panel>

          <Panel title="FAQ">
            <FaqEditor value={form.faq} onChange={(f) => set("faq", f)} />
          </Panel>

          <Panel title="Related in this series">
            <RelatedPicker
              value={form.related_blogs}
              onChange={(r) => set("related_blogs", r)}
              candidates={candidates}
              currentSlug={form.slug}
              category={form.category}
            />
          </Panel>
        </div>

        {/* ── sidebar ── */}
        <div className="flex flex-col gap-6">
          <Panel title="Search appearance">
            <div className="flex flex-col gap-5">
              <Field
                label="Focus keyword"
                htmlFor="focus"
                hint="The query this post targets. Every keyword rule below scores against it; nothing will guess one for you."
              >
                <Input
                  id="focus"
                  value={form.focus_keyword}
                  onChange={(e) => set("focus_keyword", e.target.value)}
                  placeholder="e.g. bulging disc vs herniated disc"
                />
              </Field>

              <Field label="SEO title" htmlFor="seo-title">
                <Input
                  id="seo-title"
                  value={form.seo_title}
                  onChange={(e) => set("seo_title", e.target.value)}
                  placeholder="Written for the search result, not copied from the H1"
                />
                <SeoScore
                  kind="title"
                  value={form.seo_title}
                  context={scoreContext}
                  onApply={(next) => set("seo_title", next)}
                />
              </Field>

              <Field label="Meta description" htmlFor="meta-desc">
                <Textarea
                  id="meta-desc"
                  rows={3}
                  value={form.meta_description}
                  onChange={(e) => set("meta_description", e.target.value)}
                />
                <SeoScore
                  kind="description"
                  value={form.meta_description}
                  context={scoreContext}
                  onApply={(next) => set("meta_description", next)}
                />
              </Field>

              <Field
                label="Canonical URL"
                htmlFor="canonical"
                hint="Leave blank to self-canonicalise, which is almost always right."
              >
                <Input
                  id="canonical"
                  value={form.canonical_url}
                  onChange={(e) => set("canonical_url", e.target.value)}
                  placeholder={`${siteUrl}/${form.slug || "slug"}/`}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Featured image">
            <div className="flex flex-col gap-3">
              <FeaturedImagePicker
                url={form.featured_image}
                alt={form.image_alt}
                onChange={({ url, alt }) => {
                  setForm((f) => ({ ...f, featured_image: url, image_alt: alt }));
                  setDirty(true);
                }}
              />
              <Field
                label="Alt text"
                htmlFor="alt"
                hint="What the image shows, for screen readers and when it fails to load."
              >
                <Input
                  id="alt"
                  value={form.image_alt}
                  onChange={(e) => set("image_alt", e.target.value)}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Organisation">
            <div className="flex flex-col gap-4">
              <Field label="Category" htmlFor="category">
                <Select
                  id="category"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Tags" htmlFor="tags" hint="Comma separated.">
                <Input id="tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
              </Field>

              <Field label="Author" htmlFor="author">
                <Input
                  id="author"
                  value={form.author}
                  onChange={(e) => set("author", e.target.value)}
                />
              </Field>

              <Field label="Read time" hint="Calculated from the body at 200 words per minute.">
                <Input value={`${readTime} min`} disabled readOnly />
              </Field>
            </div>
          </Panel>

          {post && (
            <Panel title="Danger zone">
              <div className="flex flex-col gap-2">
                {status === "archived" ? (
                  <AdminButton
                    disabled={busy !== null}
                    onClick={() => runAction("unarchive", (saved) => unarchivePost(saved))}
                  >
                    <ArchiveRestore className="h-4 w-4" /> Unarchive (returns to draft)
                  </AdminButton>
                ) : (
                  <AdminButton
                    disabled={busy !== null}
                    onClick={() => runAction("archive", (saved) => archivePost(saved))}
                  >
                    <ArchiveX className="h-4 w-4" /> Archive
                  </AdminButton>
                )}
                <AdminButton variant="danger" disabled={busy !== null} onClick={onDelete}>
                  <Trash2 className="h-4 w-4" /> {busy === "delete" ? "Deleting…" : "Delete post"}
                </AdminButton>
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* ── modals ── */}
      <MarkdownImport open={showImport} onClose={() => setShowImport(false)} onImport={applyImport} />

      {showPreview && (
        <PreviewModal
          onClose={() => setShowPreview(false)}
          title={form.title}
          excerpt={form.excerpt}
          blocks={form.content}
          faq={form.faq}
          seoTitle={form.seo_title}
          metaDescription={form.meta_description}
          slug={form.slug}
          publishAt={post?.publish_at ?? null}
          timeZone={form.time_zone}
          readTime={readTime}
        />
      )}

      {showVersions && post && (
        <VersionHistory
          blogId={post.id}
          onClose={() => setShowVersions(false)}
          onRestored={() => {
            setShowVersions(false);
            router.refresh();
            window.location.reload();
          }}
        />
      )}

      {showSchedule && (
        <ScheduleDialog
          publishAt={post?.publish_at ?? null}
          timeZone={form.time_zone}
          onClose={() => setShowSchedule(false)}
          onConfirm={async (at, zone) => {
            setShowSchedule(false);
            set("time_zone", zone);
            await runAction("schedule", (saved) => schedulePost(saved, at, zone));
          }}
        />
      )}
    </div>
  );
}

/* ── schedule dialog ────────────────────────────────────────────────────────── */

function ScheduleDialog({
  publishAt,
  timeZone,
  onClose,
  onConfirm,
}: {
  publishAt: string | null;
  timeZone: string;
  onClose: () => void;
  onConfirm: (at: Date, zone: string) => void;
}) {
  const [zone, setZone] = useState(timeZone || DEFAULT_TIME_ZONE);
  const initial = utcToWallTime(publishAt, zone);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [error, setError] = useState<string | null>(null);

  // This dialog is hand-built rather than a <Modal>, so it opts into the same
  // close-on-Escape behaviour explicitly.
  useEscapeKey(onClose);

  const confirm = () => {
    const at = wallTimeToUtc(date, time, zone);
    if (!at) {
      setError("Pick a date and a time.");
      return;
    }
    if (at.getTime() <= Date.now()) {
      setError("That time has already passed. Pick a future time, or use Publish now.");
      return;
    }
    onConfirm(at, zone);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-950/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Schedule post"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-border bg-white p-5"
      >
        <h2 className="font-display text-lg font-medium text-navy-900">Schedule</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          The post goes public the moment this time passes. Nothing changes in the database when
          it does — the site simply starts including it.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {error && <Banner tone="error">{error}</Banner>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" htmlFor="sched-date">
              <Input
                id="sched-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError(null);
                }}
              />
            </Field>
            <Field label="Time" htmlFor="sched-time">
              <Input
                id="sched-time"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setError(null);
                }}
              />
            </Field>
          </div>

          <Field label="Time zone" htmlFor="sched-zone">
            <Select
              id="sched-zone"
              value={zone}
              onChange={(e) => {
                setZone(e.target.value);
                setError(null);
              }}
            >
              {TIME_ZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace("_", " ")}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <AdminButton onClick={onClose}>Cancel</AdminButton>
          <AdminButton variant="primary" onClick={confirm}>
            <CalendarClock className="h-4 w-4" /> Schedule
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
