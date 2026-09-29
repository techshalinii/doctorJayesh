"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { createBlog } from "@/lib/admin/api";
import { markdownToBlocks } from "@/lib/cms/markdown-import";
import type { Block, BlogRow } from "@/lib/cms/types";
import type {
  ContentProfile,
  DuplicateMatch,
  GeneratedBlog,
  GenerationSettings,
  ScoredTopic,
  TopicCandidate,
} from "@/lib/ai/types";
import type { GenerationOutcome, JobStep } from "@/lib/ai/pipeline";
import type { CombinedReview } from "@/lib/ai/types";

function db() {
  return supabaseBrowser();
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await db().auth.getSession();
  const token = data.session?.access_token ?? "";
  return { "content-type": "application/json", authorization: `Bearer ${token}` };
}

type ApiError = string | { code?: string; message?: string; retryAfterMs?: number };

function errorMessage(error: ApiError | undefined): string | undefined {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  if (error.code === "AI_RATE_LIMITED" && error.retryAfterMs) {
    return `Gemini is temporarily rate-limited. Try again in approximately ${Math.max(1, Math.ceil(error.retryAfterMs / 1000))} seconds.`;
  }
  return error.message;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: ApiError };

  if (!response.ok) {
    if (response.status === 401) throw new Error("Your session has expired. Sign in again.");
    throw new Error(errorMessage(payload.error) ?? `Request failed (${response.status}).`);
  }
  return payload;
}

export interface StoredProfile {
  id: string;
  profile: ContentProfile;
  markdown_posts: number;
  supabase_posts: number;
  provider: string;
  model: string;
  created_at: string;
}

export interface ProviderStatus {
  provider: string;
  model: string;
  live: boolean;
}

export interface SourceCounts {
  markdown: number;
  supabase: number;
  total: number;
}

export interface ContentBrainState {
  profile: StoredProfile | null;
  sources?: SourceCounts;
  provider: ProviderStatus;
  providerError?: string;
  setupRequired?: boolean;
  error?: string;
}

export async function getContentBrain(): Promise<ContentBrainState> {
  const response = await fetch("/api/admin/ai/content-brain", { headers: await authHeaders() });
  const payload = (await response.json().catch(() => ({}))) as ContentBrainState;

  if (!response.ok && !payload.setupRequired) {
    throw new Error(payload.error ?? "Could not load the content brain.");
  }
  return payload;
}

export function refreshContentBrain(): Promise<{
  profile: StoredProfile;
  sampled: number;
  total: number;
}> {
  return post("/api/admin/ai/content-brain", {});
}

export function researchKeywords(input: {
  topic: string;
  focusKeyword?: string;
  category?: string;
}): Promise<{
  focusKeyword: string;
  secondaryKeywords: string[];
  angles: TopicCandidate[];
  duplicates: DuplicateMatch[];
  disclaimer: string;
}> {
  return post("/api/admin/ai/research-topics", { ...input, mode: "keywords" });
}

export function checkDuplicates(
  topic: string,
  focusKeyword = "",
): Promise<{ duplicates: DuplicateMatch[] }> {
  return post("/api/admin/ai/research-topics", { topic, focusKeyword, mode: "duplicates" });
}

export function generateTopics(input: {
  count: number;
  instructions?: string;
}): Promise<{ batchId: string; candidates: ScoredTopic[]; shortlist: string[] }> {
  return post("/api/admin/ai/generate-topics", input);
}

export interface GenerateInput {
  topic: string;
  category: string;
  audience: string;
  instructions: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  settings: GenerationSettings;
  refineDuplicates?: boolean;
}

export function generateBlog(input: GenerateInput): Promise<GenerationOutcome & { jobId: string | null }> {
  return post("/api/admin/ai/generate-blog", input);
}

export function runMonthlyBatch(input: {
  topics: { topic: string; focusKeyword: string; secondaryKeywords: string[]; category: string; candidateId?: string }[];
  settings: GenerationSettings;
  audience?: string;
  instructions?: string;
}): Promise<{
  status: string;
  results: (GenerationOutcome & { topic: string; candidateId?: string })[];
}> {
  return post("/api/admin/ai/monthly-run", input);
}

export function reviewBlog(input: { body: string; blogId?: string }): Promise<{
  review: CombinedReview;
}> {
  return post("/api/admin/ai/review-blog", input);
}

function withCta(blocks: Block[], cta: string): Block[] {
  if (!cta.trim()) return blocks;
  return [...blocks, { type: "paragraph", text: cta.trim() }];
}

export async function createDraftFromGeneration(
  outcome: GenerationOutcome,
  options: { author: string; generationType?: "single" | "monthly"; promptVersion?: string },
): Promise<BlogRow> {
  const blog = outcome.blog;
  if (!blog) throw new Error("There is no generated article to save.");

  const featured = blog.imageSuggestions.find((i) => i.role === "featured");

  const row = await createBlog({
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: withCta(markdownToBlocks(blog.contentMarkdown), blog.cta),
    featured_image: null,
    image_alt: featured?.altText ?? "",
    category: blog.category,
    tags: blog.tags,
    seo_title: blog.metaTitle,
    meta_description: blog.metaDescription,
    focus_keyword: blog.primaryKeyword,
    author: options.author,
    faq: blog.faq,
    related_blogs: [],
    status: "draft",
    publish_at: null,
    published_at: null,
  });

  const { error } = await db().from("blog_ai_metadata").upsert(
    {
      blog_id: row.id,
      source: "ai",
      provider: outcome.provider.provider,
      model: outcome.provider.model,
      generation_type: options.generationType ?? "single",
      prompt_version: options.promptVersion ?? "",
      medical_review: outcome.review ? (outcome.review.medical.length ? "flagged" : "clean") : "pending",
      medical_findings: outcome.review?.medical ?? [],
      style_findings: outcome.review
        ? [...outcome.review.style, ...outcome.review.originality, ...outcome.review.language]
        : [],
      grammar_findings: outcome.review?.grammar ?? [],
      image_suggestions: blog.imageSuggestions,
      internal_link_suggestions: blog.internalLinkSuggestions,
      external_source_suggestions: blog.externalSourceSuggestions,
    },
    { onConflict: "blog_id" },
  );
  if (error) console.warn("[ai] could not store generation metadata:", error.message);

  return row;
}

export interface BlogAiMetadata {
  blog_id: string;
  source: "ai" | "manual" | "markdown";
  provider: string;
  model: string;
  generation_type: "single" | "monthly";
  prompt_version: string;
  generated_at: string;
  medical_review: "pending" | "clean" | "flagged" | "approved";
  medical_findings: { severity: string; excerpt: string; issue: string; suggestion: string }[];
  style_findings: { severity: string; excerpt: string; issue: string; suggestion: string }[];
  grammar_findings: { severity: string; excerpt: string; issue: string; suggestion: string }[];
  image_suggestions: GeneratedBlog["imageSuggestions"];
  internal_link_suggestions: string[];
  external_source_suggestions: string[];
  approved: boolean;
  approved_at: string | null;
}

export async function listAiMetadata(): Promise<Record<string, BlogAiMetadata>> {
  const { data, error } = await db().from("blog_ai_metadata").select("*");
  if (error) {
    console.warn("[ai] could not read generation metadata:", error.message);
    return {};
  }
  return Object.fromEntries((data ?? []).map((row) => [row.blog_id as string, row as BlogAiMetadata]));
}

export async function getAiMetadata(blogId: string): Promise<BlogAiMetadata | null> {
  const { data } = await db().from("blog_ai_metadata").select("*").eq("blog_id", blogId).maybeSingle();
  return (data as BlogAiMetadata) ?? null;
}

export async function approveBlog(blogId: string, approved: boolean): Promise<void> {
  const { data } = await db().auth.getUser();
  const { error } = await db()
    .from("blog_ai_metadata")
    .update({
      approved,
      approved_at: approved ? new Date().toISOString() : null,
      approved_by: approved ? (data.user?.id ?? null) : null,
      ...(approved ? { medical_review: "approved" } : {}),
    })
    .eq("blog_id", blogId);
  if (error) throw new Error(`Could not record approval: ${error.message}`);
}

export interface AiSettings {
  monthly_enabled: boolean;
  blogs_per_month: number;
  generation_day: number;
  approval_required: boolean;
  auto_publish: boolean;
  default_category: string;
  instructions: string;
  last_run_at: string | null;
}

export async function getAiSettings(): Promise<AiSettings | null> {
  const { data, error } = await db().from("ai_settings").select("*").eq("id", true).maybeSingle();
  if (error) return null;
  return (data as AiSettings) ?? null;
}

export async function saveAiSettings(settings: Partial<AiSettings>): Promise<void> {
  const { error } = await db().from("ai_settings").update(settings).eq("id", true);
  if (error) throw new Error(`Could not save settings: ${error.message}`);
}

export interface AiJobRow {
  id: string;
  kind: string;
  status: string;
  steps: JobStep[];
  error: string;
  provider: string;
  model: string;
  result: Record<string, unknown> | null;
  created_at: string;
  finished_at: string | null;
}

export async function listAiJobs(limit = 20): Promise<AiJobRow[]> {
  const { data, error } = await db()
    .from("ai_jobs")
    .select("id,kind,status,steps,error,provider,model,result,created_at,finished_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as AiJobRow[];
}
