"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { readTimeFromBlocks } from "@/lib/cms/blocks";
import { isVisible } from "@/lib/cms/visibility";
import type { BlogRow, BlogVersionRow, CategoryRow, MediaRow } from "@/lib/cms/types";

/**
 * Everything the dashboard does to the database.
 *
 * All of it runs in the browser as the logged-in user, so every call is authorised by
 * that user's JWT and checked by the `blogs_admin_all` policy. There is no privileged
 * key here and no server action to impersonate one — sign out and these calls stop
 * working, which is the property that makes an admin UI safe to ship as client code.
 */

function db() {
  return supabaseBrowser();
}

function fail(error: { message: string } | null, what: string): void {
  if (error) throw new Error(`${what}: ${error.message}`);
}

/* ── reads ──────────────────────────────────────────────────────────────────── */

/**
 * The full list, including drafts and archived posts — the admin sees everything.
 *
 * Ordered by `publish_at` descending, NOT `updated_at`. Sorting by last-touched makes
 * the table reshuffle every time anything is saved, and pushes a post you just fixed a
 * typo in above one published this morning.
 */
export async function listBlogs(): Promise<BlogRow[]> {
  const { data, error } = await db()
    .from("blogs")
    .select("*")
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  fail(error, "Could not load posts");
  return (data ?? []) as BlogRow[];
}

export async function getBlog(id: string): Promise<BlogRow | null> {
  const { data, error } = await db().from("blogs").select("*").eq("id", id).maybeSingle();
  fail(error, "Could not load post");
  return (data as BlogRow) ?? null;
}

/**
 * Ordered by `sort_order`, then name.
 *
 * The topic list is deliberately not alphabetical — it groups the two surgical
 * specialities first, then conditions, then body regions — so the stored order is what
 * the dropdown and the blog filter follow. A category created in /admin gets the
 * default 1000 and lands at the end until someone gives it a place.
 */
export async function listCategories(): Promise<CategoryRow[]> {
  const { data, error } = await db()
    .from("categories")
    .select("*")
    .order("sort_order")
    .order("name");
  fail(error, "Could not load categories");
  return (data ?? []) as CategoryRow[];
}

export async function listMedia(): Promise<MediaRow[]> {
  const { data, error } = await db()
    .from("media")
    .select("*")
    .order("created_at", { ascending: false });
  fail(error, "Could not load media");
  return (data ?? []) as MediaRow[];
}

export async function listVersions(blogId: string): Promise<BlogVersionRow[]> {
  const { data, error } = await db()
    .from("blog_versions")
    .select("*")
    .eq("blog_id", blogId)
    .order("version", { ascending: false });
  fail(error, "Could not load version history");
  return (data ?? []) as BlogVersionRow[];
}

/* ── writes ─────────────────────────────────────────────────────────────────── */

/** Columns the editor owns. Anything else is set by the database or by this module. */
export type BlogInput = Partial<
  Pick<
    BlogRow,
    | "title" | "slug" | "excerpt" | "content" | "featured_image" | "image_alt"
    | "category" | "tags" | "seo_title" | "meta_description" | "focus_keyword"
    | "canonical_url" | "og_image" | "twitter_image" | "author" | "status"
    | "publish_at" | "published_at" | "time_zone" | "related_blogs" | "faq"
    | "read_time" | "previous_slugs"
  >
>;

async function currentUser(): Promise<{ id: string | null; email: string }> {
  const { data } = await db().auth.getUser();
  return { id: data.user?.id ?? null, email: data.user?.email ?? "" };
}

export async function createBlog(input: BlogInput): Promise<BlogRow> {
  const user = await currentUser();
  const { data, error } = await db()
    .from("blogs")
    .insert({
      ...input,
      read_time: input.read_time ?? readTimeFromBlocks(input.content ?? []),
      created_by: user.id,
      created_by_email: user.email,
      updated_by: user.id,
      version: 1,
    })
    .select()
    .single();
  fail(error, "Could not create post");
  return data as BlogRow;
}

/**
 * Save an edit, snapshotting what was there first.
 *
 * The snapshot is written BEFORE the update so a restore always has something to go
 * back to, and it carries the version number that was current at the time — the row's
 * `version` is then bumped, so "version 4" in the history is the state the post was in
 * while it was at version 4.
 *
 * If the snapshot insert fails the update still proceeds: losing the ability to undo is
 * bad, but refusing to save the author's work because the audit trail is unavailable is
 * worse.
 */
export async function updateBlog(id: string, input: BlogInput, note = ""): Promise<BlogRow> {
  const user = await currentUser();
  const previous = await getBlog(id);

  if (previous) {
    const { error } = await db().from("blog_versions").insert({
      blog_id: id,
      version: previous.version,
      snapshot: previous,
      note,
      created_by: user.id,
    });
    if (error) console.warn("[admin] version snapshot failed:", error.message);
  }

  // A slug that changes on a post that has been live keeps the old value, so the old
  // URL keeps resolving — see getCmsRedirectTarget().
  const previousSlugs = new Set(previous?.previous_slugs ?? []);
  if (previous && input.slug && input.slug !== previous.slug && hasBeenLive(previous)) {
    previousSlugs.add(previous.slug);
  }
  previousSlugs.delete(input.slug ?? previous?.slug ?? "");

  const { data, error } = await db()
    .from("blogs")
    .update({
      ...input,
      previous_slugs: [...previousSlugs],
      read_time: input.read_time ?? (input.content ? readTimeFromBlocks(input.content) : undefined),
      updated_by: user.id,
      version: (previous?.version ?? 1) + 1,
    })
    .eq("id", id)
    .select()
    .single();
  fail(error, "Could not save post");
  return data as BlogRow;
}

/** Has this post ever been reachable by the public? Drives slug freezing. */
export function hasBeenLive(post: BlogRow): boolean {
  return Boolean(post.published_at) || isVisible(post);
}

export async function deleteBlog(id: string): Promise<void> {
  const { error } = await db().from("blogs").delete().eq("id", id);
  fail(error, "Could not delete post");
}

/**
 * Copy a post as a fresh draft.
 *
 * Deliberately resets identity and schedule: a duplicate is a starting point, not a
 * second copy of a live article. Publishing one is a decision the author makes again.
 */
export async function duplicateBlog(id: string): Promise<BlogRow> {
  const source = await getBlog(id);
  if (!source) throw new Error("Post not found");

  const base = `${source.slug}-copy`;
  const existing = new Set((await listBlogs()).map((b) => b.slug));
  let slug = base;
  for (let i = 2; existing.has(slug); i++) slug = `${base}-${i}`;

  return createBlog({
    title: `${source.title} (copy)`,
    slug,
    previous_slugs: [],
    excerpt: source.excerpt,
    content: source.content,
    featured_image: source.featured_image,
    image_alt: source.image_alt,
    category: source.category,
    tags: source.tags,
    seo_title: source.seo_title,
    meta_description: source.meta_description,
    focus_keyword: source.focus_keyword,
    canonical_url: null,
    og_image: source.og_image,
    twitter_image: source.twitter_image,
    author: source.author,
    time_zone: source.time_zone,
    related_blogs: source.related_blogs,
    faq: source.faq,
    read_time: source.read_time,
    status: "draft",
    publish_at: null,
    published_at: null,
  });
}

/**
 * Publish immediately.
 *
 * On a post that is ALREADY live, `publish_at` is left alone. Re-publishing after an
 * edit must not move the article to the top of the blog or change its sitemap date —
 * it was published when it was published. Only `published_at` is stamped on the first
 * transition, and that column never drives anything public.
 */
export async function publishNow(post: BlogRow): Promise<BlogRow> {
  const now = new Date().toISOString();
  const live = hasBeenLive(post);

  return updateBlog(
    post.id,
    {
      status: "published",
      publish_at: live ? (post.publish_at ?? now) : now,
      published_at: post.published_at ?? now,
    },
    "Published",
  );
}

/** Schedule for a future instant. Refuses the past — that is a publish, not a schedule. */
export async function schedulePost(
  post: BlogRow,
  publishAt: Date,
  timeZone: string,
): Promise<BlogRow> {
  if (publishAt.getTime() <= Date.now()) {
    throw new Error("Pick a time in the future, or use Publish Now.");
  }
  return updateBlog(
    post.id,
    { status: "scheduled", publish_at: publishAt.toISOString(), time_zone: timeZone },
    "Scheduled",
  );
}

export async function archivePost(post: BlogRow): Promise<BlogRow> {
  return updateBlog(post.id, { status: "archived" }, "Archived");
}

/**
 * Bring an archived post back.
 *
 * It returns as a DRAFT, not straight to live. Un-archiving is an editorial intention
 * to look at something again; making it public again should be a separate, deliberate
 * click.
 */
export async function unarchivePost(post: BlogRow): Promise<BlogRow> {
  return updateBlog(post.id, { status: "draft" }, "Unarchived");
}

export async function restoreVersion(blogId: string, version: BlogVersionRow): Promise<BlogRow> {
  const s = version.snapshot;
  return updateBlog(
    blogId,
    {
      title: s.title,
      excerpt: s.excerpt,
      content: s.content,
      featured_image: s.featured_image,
      image_alt: s.image_alt,
      category: s.category,
      tags: s.tags,
      seo_title: s.seo_title,
      meta_description: s.meta_description,
      focus_keyword: s.focus_keyword,
      canonical_url: s.canonical_url,
      og_image: s.og_image,
      twitter_image: s.twitter_image,
      author: s.author,
      related_blogs: s.related_blogs,
      faq: s.faq,
      read_time: s.read_time,
      // Status and schedule are NOT restored. Reverting the copy of a live post must
      // not silently unpublish it.
    },
    `Restored from version ${version.version}`,
  );
}

/* ── categories ─────────────────────────────────────────────────────────────── */

export async function upsertCategory(input: {
  id?: string;
  slug: string;
  name: string;
  description: string;
  sort_order?: number;
}): Promise<CategoryRow> {
  const query = input.id
    ? db().from("categories").update(input).eq("id", input.id)
    : db().from("categories").insert(input);
  const { data, error } = await query.select().single();
  fail(error, "Could not save category");
  return data as CategoryRow;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await db().from("categories").delete().eq("id", id);
  fail(error, "Could not delete category");
}

/* ── media ──────────────────────────────────────────────────────────────────── */

const BUCKET = "blog-images";

/** Upload to storage and record the file, returning the public URL to reference. */
export async function uploadMedia(file: File, alt = ""): Promise<MediaRow> {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
  // Date-partitioned and randomised: two uploads of "scan.jpg" must not collide, and a
  // flat bucket with thousands of objects is unpleasant to browse.
  const now = new Date();
  const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await db()
    .storage.from(BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  fail(uploadError, "Upload failed");

  const { data: urlData } = db().storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await db()
    .from("media")
    .insert({
      path,
      url: urlData.publicUrl,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      alt,
      created_by: (await currentUser()).id,
    })
    .select()
    .single();
  fail(error, "Could not record upload");
  return data as MediaRow;
}

export async function deleteMedia(item: MediaRow): Promise<void> {
  const { error: storageError } = await db().storage.from(BUCKET).remove([item.path]);
  if (storageError) console.warn("[admin] storage delete failed:", storageError.message);
  const { error } = await db().from("media").delete().eq("id", item.id);
  fail(error, "Could not delete media");
}

/* ── revalidation ───────────────────────────────────────────────────────────── */

/**
 * Ask the site to rebuild the pages this post appears on.
 *
 * Best-effort on purpose: the write already succeeded, and ISR would pick the change up
 * within the minute anyway. A failure here is worth a console warning, never an error
 * dialog telling the author their save did not work.
 */
export async function revalidate(slugs: string[]): Promise<void> {
  try {
    const { data } = await db().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    await fetch("/api/revalidate/", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ slugs }),
    });
  } catch (error) {
    console.warn("[admin] revalidation request failed:", error);
  }
}
