import type { BlogStatus } from "@/lib/cms/types";

export const VISIBLE_STATUSES = ["published", "scheduled"] as const satisfies readonly BlogStatus[];

export interface VisibilityFields {
  status: string;
  publish_at: string | null;
}

export function isVisible(post: VisibilityFields, now: Date = new Date()): boolean {
  if (!(VISIBLE_STATUSES as readonly string[]).includes(post.status)) return false;
  if (!post.publish_at) return false;
  const at = Date.parse(post.publish_at);
  return Number.isFinite(at) && at <= now.getTime();
}

interface FilterableQuery {
  in(column: string, values: readonly string[]): FilterableQuery;
  lte(column: string, value: string): FilterableQuery;
}

export function applyVisibility<Q>(query: Q, now: Date = new Date()): Q {
  return (query as FilterableQuery)
    .in("status", VISIBLE_STATUSES)
    .lte("publish_at", now.toISOString()) as Q;
}
