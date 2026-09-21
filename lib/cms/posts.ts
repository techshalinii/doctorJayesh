import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import { CMS_ENABLED } from "@/lib/supabase/config";
import { applyVisibility, isVisible } from "@/lib/cms/visibility";
import { parseBlocks } from "@/lib/cms/blocks";
import type { BlogRow, FaqItem } from "@/lib/cms/types";

/**
 * Read path for CMS posts.
 *
 * Three guarantees, in order of importance:
 *
 * 1. **Never 500.** Every failure — no credentials, network error, RLS change,
 *    malformed row — resolves to the last good snapshot, or to an empty list. The
 *    site then renders with only its 180 migrated markdown posts, which is exactly
 *    what it did before the CMS existed.
 * 2. **Never leak.** Rows come back through `applyVisibility()`, and are filtered
 *    again by `isVisible()` after parsing so a row that became due between fetch
 *    and render is not held back, and one that is not due cannot slip through a
 *    stale snapshot.
 * 3. **Cheap.** One query serves the listing, the sitemap, every article page and
 *    every related-post lookup, cached ~60s and refreshed in the background so a
 *    request never waits on a revalidation.
 */

const TTL_MS = 60_000;
/** After a failure, stop hammering a sick database for this long. */
const BACKOFF_MS = 30_000;

interface Snapshot {
  rows: BlogRow[];
  fetchedAt: number;
}

let snapshot: Snapshot | null = null;
let inflight: Promise<BlogRow[]> | null = null;
let retryAfter = 0;

function parseFaq(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const r = raw as Record<string, unknown>;
    const question = typeof r.question === "string" ? r.question : "";
    const answer = typeof r.answer === "string" ? r.answer : "";
    return question && answer ? [{ question, answer }] : [];
  });
}

function normalise(raw: Record<string, unknown>): BlogRow {
  const str = (k: string, fallback = "") => (typeof raw[k] === "string" ? (raw[k] as string) : fallback);
  const nullable = (k: string) => (typeof raw[k] === "string" && raw[k] ? (raw[k] as string) : null);
  const list = (k: string) =>
    Array.isArray(raw[k]) ? (raw[k] as unknown[]).filter((v): v is string => typeof v === "string") : [];

  return {
    id: str("id"),
    title: str("title"),
    slug: str("slug"),
    previous_slugs: list("previous_slugs"),
    excerpt: str("excerpt"),
    content: parseBlocks(raw.content),
    featured_image: nullable("featured_image"),
    image_alt: str("image_alt"),
    category: str("category"),
    tags: list("tags"),
    seo_title: str("seo_title"),
    meta_description: str("meta_description"),
    focus_keyword: str("focus_keyword"),
    canonical_url: nullable("canonical_url"),
    og_image: nullable("og_image"),
    twitter_image: nullable("twitter_image"),
    read_time: typeof raw.read_time === "number" ? raw.read_time : 1,
    author: str("author"),
    status: (["draft", "scheduled", "published", "archived"] as const).includes(
      raw.status as "draft",
    )
      ? (raw.status as BlogRow["status"])
      : "draft",
    publish_at: nullable("publish_at"),
    published_at: nullable("published_at"),
    time_zone: str("time_zone", "Asia/Kolkata"),
    related_blogs: list("related_blogs"),
    faq: parseFaq(raw.faq),
    version: typeof raw.version === "number" ? raw.version : 1,
    created_at: str("created_at"),
    updated_at: str("updated_at"),
    created_by: nullable("created_by"),
    updated_by: nullable("updated_by"),
    created_by_email: str("created_by_email"),
  };
}

async function fetchVisible(): Promise<BlogRow[]> {
  const query = applyVisibility(
    supabaseServer().from("blogs").select("*"),
  ).order("publish_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalise(row as Record<string, unknown>));
}

/**
 * Kick a refresh without making the caller wait for it.
 *
 * The promise is stored so concurrent requests share one query, and its rejection
 * is swallowed here — a background refresh failing must never surface as an
 * unhandled rejection, let alone as a 500.
 */
function refresh(): Promise<BlogRow[]> {
  if (inflight) return inflight;
  inflight = fetchVisible()
    .then((rows) => {
      snapshot = { rows, fetchedAt: Date.now() };
      retryAfter = 0;
      return rows;
    })
    .catch((err: unknown) => {
      retryAfter = Date.now() + BACKOFF_MS;
      console.error("[cms] refresh failed, serving last known posts:", err);
      return snapshot?.rows ?? [];
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Every currently-visible CMS post, newest first. Resolves to `[]` on any failure. */
export async function getCmsPosts(): Promise<BlogRow[]> {
  if (!CMS_ENABLED) return [];

  const now = Date.now();
  const fresh = snapshot && now - snapshot.fetchedAt < TTL_MS;

  if (fresh) return filterDue(snapshot!.rows);

  // Stale but usable: serve it and refresh behind the request, unless the last
  // attempt failed recently — in which case keep serving stale and stay quiet.
  if (snapshot) {
    if (now >= retryAfter) void refresh();
    return filterDue(snapshot.rows);
  }

  // Cold and recently failed: do not retry on this request.
  if (now < retryAfter) return [];

  return filterDue(await refresh());
}

/**
 * Re-check the rule against the clock at RENDER time.
 *
 * A snapshot is up to a minute old, so a post scheduled inside that window is
 * already in it but not yet due. Filtering here — rather than trusting the fetch —
 * is what makes the cache safe to share between the listing, the sitemap and the
 * article route.
 */
function filterDue(rows: BlogRow[]): BlogRow[] {
  const now = new Date();
  return rows.filter((row) => isVisible(row, now));
}

/**
 * Deliberately no `getCmsPostBySlug` or `getCmsSlugs` here.
 *
 * Both belong to lib/cms/public.ts, which is the only module that knows the migrated
 * markdown owns some slugs. A by-slug lookup on this raw reader would happily return a
 * CMS row for a URL `content/` already serves, which is exactly the precedence bug the
 * merge layer exists to prevent — so the lookup lives where the rule does.
 */

/**
 * Drop the memo so the next read hits the database. Used by /api/revalidate.
 *
 * Process-local, so on a multi-instance deployment it clears the instance that handled
 * the request and no other. That is fine and deliberate: the others expire their own
 * snapshot within the same 60 seconds ISR already promises. A cross-instance flush
 * would need a shared cache, which is a lot of machinery to shave seconds off a blog.
 */
export function invalidateCmsCache(): void {
  snapshot = null;
  retryAfter = 0;
}
