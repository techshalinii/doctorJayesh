import "server-only";

import { getCmsPosts } from "@/lib/cms/posts";
import { getAllDocs, getPosts, toPostSummary, type PostSummary } from "@/lib/content";
import type { BlogRow } from "@/lib/cms/types";

/**
 * The merge point between the two content sources.
 *
 * `content/*.md` holds the 180 migrated WordPress posts. Supabase holds everything
 * written since. Both are served from `/{slug}/`, so this module is where the union
 * is formed — and it is the ONLY place that decides precedence:
 *
 *   **On a slug clash the migrated markdown post wins.**
 *
 * Those URLs are indexed, carry backlinks and are byte-identical to what WordPress
 * served. A CMS row must never be able to take one over, whether by accident or by
 * someone typing an existing slug into the editor.
 *
 * Everything here reads visibility through lib/cms/posts.ts, which applies the rule
 * in lib/cms/visibility.ts. Nothing in this file re-implements it.
 */

/** Shown when a CMS post has no featured image, so `next/image` always has a source. */
export const FALLBACK_IMAGE = "/og-image.png";

/**
 * Single-segment paths the site already answers from somewhere other than the CMS.
 *
 * Hand-built routes under `app/` take precedence over the `[slug]` segment, so a CMS
 * post using one of these names would be published, listed and submitted to Google
 * while its URL served a completely different page.
 *
 * `/contact` is here although it only 301s: a post at that slug would never be reached
 * either.
 */
const APP_ROUTE_SLUGS = [
  "about", "admin", "api", "appointment", "blog", "brain-surgery", "conditions",
  "contact", "contact-us", "news-awards", "spine-surgery", "tag", "testimonials",
] as const;

/**
 * Every root slug a CMS post must not take.
 *
 * This is the whole of `content/` at the root — NOT just the posts. The migration also
 * put pages there (`brain-tumor`, `fellowship`, `surgeries`, `thank-you`, …), and they
 * are served by the same `app/[slug]` route, so they own their slugs just as firmly.
 *
 * Read once per process: `content/` is on disk and fixed at build time.
 */
let reservedSlugs: Set<string> | null = null;

export function getReservedSlugs(): Set<string> {
  if (!reservedSlugs) {
    reservedSlugs = new Set<string>(APP_ROUTE_SLUGS);
    for (const doc of getAllDocs()) {
      // Tag archives live at `tag/<name>`; the `tag` prefix is already reserved above.
      if (!doc.fileSlug.includes("/")) reservedSlugs.add(doc.fileSlug);
    }
  }
  return reservedSlugs;
}

/** CMS posts that do not collide with anything the site already serves. */
export async function getCmsPostsForPublic(): Promise<BlogRow[]> {
  const reserved = getReservedSlugs();
  return (await getCmsPosts()).filter((p) => !reserved.has(p.slug));
}

/** Slugs to prerender for CMS posts. Migrated slugs are already covered elsewhere. */
export async function getCmsSlugs(): Promise<string[]> {
  return (await getCmsPostsForPublic()).map((p) => p.slug);
}

export function cmsToSummary(post: BlogRow): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    ...(post.category ? { category: post.category } : {}),
    excerpt: post.excerpt,
    readingTime: `${post.read_time} min read`,
    // `publish_at`, not `published_at` — the author-set date is the public one.
    date: post.publish_at ?? "",
    image: post.featured_image || FALLBACK_IMAGE,
  };
}

/**
 * Every publicly visible post from both sources, newest first.
 *
 * The first entry is flagged `featured` for the listing hero, matching what
 * `getPostSummaries()` did when markdown was the only source.
 */
export async function getMergedPostSummaries(): Promise<PostSummary[]> {
  const cms = (await getCmsPostsForPublic()).map(cmsToSummary);
  const migrated = getPosts().map(toPostSummary);

  return [...cms, ...migrated]
    .sort((a, b) => Date.parse(b.date || "0") - Date.parse(a.date || "0"))
    .map((post, i) => ({ ...post, featured: i === 0 }));
}

/**
 * A CMS post for `/{slug}/`, or null.
 *
 * Returns null for a slug the markdown owns, so the caller cannot accidentally serve
 * a CMS row at a migrated URL even if it asks for one by name.
 */
export async function getCmsPostForRoute(slug: string): Promise<BlogRow | null> {
  if (getReservedSlugs().has(slug)) return null;
  return (await getCmsPostsForPublic()).find((p) => p.slug === slug) ?? null;
}

/**
 * The current slug of a post that used to live at `slug`, or null.
 *
 * A slug is frozen in the editor once a post is live, but an author can still unfreeze
 * and change one. When that happens the old value is kept in `previous_slugs` and this
 * lookup lets `app/[slug]` answer the old URL with a 308 instead of a 404 — the URL may
 * already be indexed or linked, and losing it silently is the expensive failure.
 *
 * A slug the migrated markdown owns is never treated as a redirect source: that content
 * is served from its own file and must keep answering 200.
 */
export async function getCmsRedirectTarget(slug: string): Promise<string | null> {
  if (getReservedSlugs().has(slug)) return null;
  const match = (await getCmsPostsForPublic()).find((p) => p.previous_slugs.includes(slug));
  return match ? match.slug : null;
}

/**
 * Sitemap rows for CMS posts.
 *
 * `lastmod` is `updated_at` — when the article was last changed — which is what the tag
 * means, and is distinct from `publish_at`, which is the date the page displays.
 */
export async function getCmsSitemapEntries(): Promise<{ url: string; lastModified: Date }[]> {
  return (await getCmsPostsForPublic()).map((p) => ({
    url: `/${p.slug}/`,
    lastModified: new Date(p.updated_at || p.publish_at || Date.now()),
  }));
}

/**
 * Related posts for an article page.
 *
 * The author's hand-picked `related_blogs` slugs come first and in their stored
 * order; the rest of the slots are filled from the same category, then from the
 * newest posts overall. Both sources are eligible, so a new CMS post can point at a
 * migrated article and vice versa.
 */
export async function getRelatedFor(post: BlogRow, limit = 3): Promise<PostSummary[]> {
  const all = await getMergedPostSummaries();
  const pool = all.filter((p) => p.slug !== post.slug);

  const picked: PostSummary[] = [];
  const take = (candidate: PostSummary | undefined) => {
    if (candidate && !picked.some((p) => p.slug === candidate.slug)) picked.push(candidate);
  };

  for (const slug of post.related_blogs) take(pool.find((p) => p.slug === slug));
  if (post.category) for (const p of pool.filter((p) => p.category === post.category)) take(p);
  for (const p of pool) take(p);

  return picked.slice(0, limit);
}
