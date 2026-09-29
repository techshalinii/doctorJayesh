import "server-only";

import { getCmsPosts } from "@/lib/cms/posts";
import { getAllDocs, getPosts, toPostSummary, type PostSummary } from "@/lib/content";
import type { BlogRow } from "@/lib/cms/types";

export const FALLBACK_IMAGE = "/og-image.png";

const APP_ROUTE_SLUGS = [
  "about", "admin", "api", "appointment", "blog", "brain-surgery", "conditions",
  "contact", "contact-us", "fellowship", "news-awards", "spine-surgery", "tag", "testimonials",
] as const;

let reservedSlugs: Set<string> | null = null;

export function getReservedSlugs(): Set<string> {
  if (!reservedSlugs) {
    reservedSlugs = new Set<string>(APP_ROUTE_SLUGS);
    for (const doc of getAllDocs()) {
      if (!doc.fileSlug.includes("/")) reservedSlugs.add(doc.fileSlug);
    }
  }
  return reservedSlugs;
}

export async function getCmsPostsForPublic(): Promise<BlogRow[]> {
  const reserved = getReservedSlugs();
  return (await getCmsPosts()).filter((p) => !reserved.has(p.slug));
}

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
    date: post.publish_at ?? "",
    image: post.featured_image || FALLBACK_IMAGE,
  };
}

export async function getMergedPostSummaries(): Promise<PostSummary[]> {
  const cms = (await getCmsPostsForPublic()).map(cmsToSummary);
  const migrated = getPosts().map(toPostSummary);

  return [...cms, ...migrated]
    .sort((a, b) => Date.parse(b.date || "0") - Date.parse(a.date || "0"))
    .map((post, i) => ({ ...post, featured: i === 0 }));
}

export async function getCmsPostForRoute(slug: string): Promise<BlogRow | null> {
  if (getReservedSlugs().has(slug)) return null;
  return (await getCmsPostsForPublic()).find((p) => p.slug === slug) ?? null;
}

export async function getCmsRedirectTarget(slug: string): Promise<string | null> {
  if (getReservedSlugs().has(slug)) return null;
  const match = (await getCmsPostsForPublic()).find((p) => p.previous_slugs.includes(slug));
  return match ? match.slug : null;
}

export async function getCmsSitemapEntries(): Promise<{ url: string; lastModified: Date }[]> {
  return (await getCmsPostsForPublic()).map((p) => ({
    url: `/${p.slug}/`,
    lastModified: new Date(p.updated_at || p.publish_at || Date.now()),
  }));
}

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
