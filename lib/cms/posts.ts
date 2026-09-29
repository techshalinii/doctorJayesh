import "server-only";

import { supabaseServer } from "@/lib/supabase/server";
import { CMS_ENABLED } from "@/lib/supabase/config";
import { applyVisibility, isVisible } from "@/lib/cms/visibility";
import { parseBlocks } from "@/lib/cms/blocks";
import type { BlogRow, FaqItem } from "@/lib/cms/types";

const TTL_MS = 60_000;
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

export async function getCmsPosts(): Promise<BlogRow[]> {
  if (!CMS_ENABLED) return [];

  const now = Date.now();
  const fresh = snapshot && now - snapshot.fetchedAt < TTL_MS;

  if (fresh) return filterDue(snapshot!.rows);

  if (snapshot) {
    if (now >= retryAfter) void refresh();
    return filterDue(snapshot.rows);
  }

  if (now < retryAfter) return [];

  return filterDue(await refresh());
}

function filterDue(rows: BlogRow[]): BlogRow[] {
  const now = new Date();
  return rows.filter((row) => isVisible(row, now));
}

export function invalidateCmsCache(): void {
  snapshot = null;
  retryAfter = 0;
}
