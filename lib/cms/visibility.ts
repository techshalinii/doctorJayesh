import type { BlogStatus } from "@/lib/cms/types";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE visibility rule. One definition, used by everything.
 * ════════════════════════════════════════════════════════════════════════════
 *
 *     status in ('published','scheduled')  AND  publish_at <= now()
 *
 * The listing, the article route, the sitemap, the related-post lookup and the
 * admin preview all go through `applyVisibility()` or `isVisible()`. Nothing
 * re-states the condition inline.
 *
 * A scheduled post goes live because the CLOCK MOVED — no row changes, no cron
 * flips `scheduled` → `published`. That is why `publish_at` (the author-set date)
 * and not `published_at` (the internal first-went-live stamp) is the column
 * tested: a scheduled post has no `published_at` yet, so testing that one would
 * hide it forever.
 *
 * The same predicate is enforced in Postgres by `public.blog_is_visible()` and
 * the `blogs_public_read` RLS policy, so a draft cannot leak even if a caller
 * bypasses this module. This copy exists to keep queries narrow and to let
 * already-fetched rows be re-checked without another round trip.
 */

export const VISIBLE_STATUSES = ["published", "scheduled"] as const satisfies readonly BlogStatus[];

/** The shape any visibility check needs. Deliberately structural, not `BlogRow`. */
export interface VisibilityFields {
  status: string;
  publish_at: string | null;
}

/** Predicate form — for rows already in memory. */
export function isVisible(post: VisibilityFields, now: Date = new Date()): boolean {
  if (!(VISIBLE_STATUSES as readonly string[]).includes(post.status)) return false;
  if (!post.publish_at) return false;
  const at = Date.parse(post.publish_at);
  return Number.isFinite(at) && at <= now.getTime();
}

/**
 * Query form — narrows a PostgREST select to visible rows only.
 *
 * Typed against the two builder methods actually used rather than against
 * `PostgrestFilterBuilder`, whose six generic parameters change shape between
 * supabase-js minor versions; naming it here would pin this file to one of them,
 * and expressing the builder's fluent self-return as a generic bound makes the
 * checker recurse without end.
 *
 * The caller's own type is returned unchanged, so the query stays fully typed on
 * the other side of the call.
 */
interface FilterableQuery {
  in(column: string, values: readonly string[]): FilterableQuery;
  lte(column: string, value: string): FilterableQuery;
}

export function applyVisibility<Q>(query: Q, now: Date = new Date()): Q {
  // `lte` on a nullable column already excludes NULL under SQL's three-valued
  // logic, so a row with no publish_at can never satisfy it.
  return (query as FilterableQuery)
    .in("status", VISIBLE_STATUSES)
    .lte("publish_at", now.toISOString()) as Q;
}
