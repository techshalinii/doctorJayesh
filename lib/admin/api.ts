"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { readTimeFromBlocks } from "@/lib/cms/blocks";
import { isVisible } from "@/lib/cms/visibility";
import type { BlogRow, BlogVersionRow, CategoryRow, MediaRow } from "@/lib/cms/types";

function db() {
  return supabaseBrowser();
}

function fail(error: { message: string } | null, what: string): void {
  if (error) throw new Error(`${what}: ${error.message}`);
}

const LIST_COLUMNS = [
  "id", "title", "slug", "previous_slugs", "excerpt", "featured_image", "image_alt",
  "category", "tags", "seo_title", "meta_description", "focus_keyword", "canonical_url",
  "og_image", "twitter_image", "read_time", "author", "status", "publish_at",
  "published_at", "time_zone", "related_blogs", "faq", "version", "created_at",
  "updated_at", "created_by", "updated_by", "created_by_email",
].join(",");

export type BlogListItem = Omit<BlogRow, "content">;

export async function listBlogs(): Promise<BlogListItem[]> {
  const { data, error } = await db()
    .from("blogs")
    .select(LIST_COLUMNS)
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  fail(error, "Could not load posts");
  return (data ?? []) as unknown as BlogListItem[];
}

export async function getBlog(id: string): Promise<BlogRow | null> {
  const { data, error } = await db().from("blogs").select("*").eq("id", id).maybeSingle();
  fail(error, "Could not load post");
  return (data as BlogRow) ?? null;
}

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

export type BlogVersionSummary = Omit<BlogVersionRow, "snapshot"> & { title: string | null };

export async function listVersions(blogId: string): Promise<BlogVersionSummary[]> {
  const { data, error } = await db()
    .from("blog_versions")
    .select("id,blog_id,version,note,created_at,created_by,title:snapshot->>title")
    .eq("blog_id", blogId)
    .order("version", { ascending: false });
  fail(error, "Could not load version history");
  return (data ?? []) as unknown as BlogVersionSummary[];
}

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

export function hasBeenLive(post: BlogListItem): boolean {
  return Boolean(post.published_at) || isVisible(post);
}

export async function deleteBlog(id: string): Promise<void> {
  const { error } = await db().from("blogs").delete().eq("id", id);
  fail(error, "Could not delete post");
}

export async function duplicateBlog(id: string): Promise<BlogRow> {
  const source = await getBlog(id);
  if (!source) throw new Error("Post not found");

  const base = `${source.slug}-copy`;
  const { data: slugRows } = await db().from("blogs").select("slug");
  const existing = new Set((slugRows ?? []).map((b) => b.slug as string));
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

export async function publishNow(post: BlogListItem): Promise<BlogRow> {
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

export async function schedulePost(
  post: BlogListItem,
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

export async function archivePost(post: BlogListItem): Promise<BlogRow> {
  return updateBlog(post.id, { status: "archived" }, "Archived");
}

export async function unarchivePost(post: BlogListItem): Promise<BlogRow> {
  return updateBlog(post.id, { status: "draft" }, "Unarchived");
}

export async function restoreVersion(blogId: string, versionId: string): Promise<BlogRow> {
  const { data, error } = await db()
    .from("blog_versions")
    .select("version,snapshot")
    .eq("id", versionId)
    .maybeSingle();
  fail(error, "Could not load that version");
  if (!data) throw new Error("That version no longer exists.");

  const row = data as { version: number; snapshot: Partial<BlogRow> };
  const s = row.snapshot;
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
    },
    `Restored from version ${row.version}`,
  );
}

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

const BUCKET = "blog-images";

export async function uploadMedia(file: File, alt = ""): Promise<MediaRow> {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
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
