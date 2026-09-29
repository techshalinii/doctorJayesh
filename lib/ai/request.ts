import "server-only";

import { getReservedSlugs } from "@/lib/cms/public";
import { fullCorpus, neighbouringTitles } from "@/lib/cms/content-brain";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlogRow } from "@/lib/cms/types";
import type { ContentProfile, CorpusItem, GenerationSettings } from "./types";

const MAX_WORDS = 4000;
const MIN_WORDS = 300;

export const DEFAULT_SETTINGS: GenerationSettings = {
  targetWordCount: 1200,
  tone: "Clear, calm and patient-friendly",
  language: "English (India)",
  includeFaq: true,
  includeCta: true,
  includeInternalLinks: true,
  includeExternalSources: false,
  includeImageSuggestions: true,
  followHouseStyle: true,
};

function str(value: unknown, max: number, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, max) : fallback;
}

function strList(value: unknown, max: number, limit: number): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string").map((v) => v.trim().slice(0, max)).filter(Boolean).slice(0, limit)
    : [];
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function readSettings(raw: unknown): GenerationSettings {
  const input = (raw ?? {}) as Record<string, unknown>;
  const words = Number(input.targetWordCount);

  return {
    targetWordCount: Number.isFinite(words)
      ? Math.min(MAX_WORDS, Math.max(MIN_WORDS, Math.round(words)))
      : DEFAULT_SETTINGS.targetWordCount,
    tone: str(input.tone, 200, DEFAULT_SETTINGS.tone) || DEFAULT_SETTINGS.tone,
    language: str(input.language, 80, DEFAULT_SETTINGS.language) || DEFAULT_SETTINGS.language,
    includeFaq: bool(input.includeFaq, DEFAULT_SETTINGS.includeFaq),
    includeCta: bool(input.includeCta, DEFAULT_SETTINGS.includeCta),
    includeInternalLinks: bool(input.includeInternalLinks, DEFAULT_SETTINGS.includeInternalLinks),
    includeExternalSources: bool(input.includeExternalSources, DEFAULT_SETTINGS.includeExternalSources),
    includeImageSuggestions: bool(input.includeImageSuggestions, DEFAULT_SETTINGS.includeImageSuggestions),
    followHouseStyle: bool(input.followHouseStyle, DEFAULT_SETTINGS.followHouseStyle),
  };
}

export const readText = str;
export const readList = strList;

export async function loadCorpus(db: SupabaseClient): Promise<CorpusItem[]> {
  const { data, error } = await db
    .from("blogs")
    .select("id,title,slug,excerpt,content,category,tags,focus_keyword,seo_title,meta_description,image_alt,faq,status,publish_at");
  if (error) throw new Error(`Could not read existing posts: ${error.message}`);

  return fullCorpus((data ?? []) as unknown as BlogRow[]);
}

export async function loadProfile(db: SupabaseClient): Promise<ContentProfile | null> {
  const { data, error } = await db
    .from("content_profiles")
    .select("profile")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data?.profile as ContentProfile) ?? null;
}

export function reservedSlugSet(corpus: CorpusItem[]): Set<string> {
  return new Set<string>([...getReservedSlugs(), ...corpus.map((c) => c.slug)]);
}

export { neighbouringTitles };
