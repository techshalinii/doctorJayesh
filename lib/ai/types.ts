import type { FaqItem } from "@/lib/cms/types";
import type { RetrievedArticle } from "@/lib/ai/retrieval";

export interface CorpusItem {
  source: "markdown" | "supabase";
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  categories: string[];
  tags: string[];
  focusKeyword: string;
  seoTitle: string;
  metaDescription: string;
  wordCount: number;
  hasFaq: boolean;
  imageAlt: string;
  publishedAt: string | null;
}

export interface ContentProfile {
  writingStyle: {
    tone: string;
    vocabulary: string;
    sentenceStructure: string;
    paragraphStructure: string;
    introductionStyle: string;
    conclusionStyle: string;
    headingPatterns: string;
    faqStyle: string;
    ctaStyle: string;
    medicalTerminology: string;
    patientFriendlyLanguage: string;
    typicalWordCount: number;
  };
  topicIntelligence: {
    clusters: { name: string; topics: string[] }[];
    coveredTopics: string[];
    contentGaps: string[];
    topicsToAvoid: string[];
    recentTopics: string[];
  };
  seoPatterns: {
    titlePatterns: string[];
    metaDescriptionPatterns: string[];
    keywordUsage: string;
    slugPatterns: string;
    headingStructure: string;
    internalLinking: string;
  };
  imagePatterns: {
    style: string;
    composition: string;
    subject: string;
    realism: string;
    aspectRatio: string;
    textPolicy: string;
    featuredImageStyle: string;
  };
  stats: {
    markdownPosts: number;
    supabasePosts: number;
    analysedAt: string;
  };
}

export type SearchIntent = "informational" | "symptom" | "treatment" | "comparison";

export interface TopicCandidate {
  topic: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  intent: SearchIntent;
  contentGap: string;
  reason: string;
  aiEstimate: number;
  category: string;
}

export interface ScoredTopic extends TopicCandidate {
  similar: DuplicateMatch[];
}

export interface DuplicateMatch {
  title: string;
  slug: string;
  url: string;
  source: "markdown" | "supabase";
  score: number;
  reason: string;
}

export interface ImageSuggestion {
  role: "featured" | "supporting";
  concept: string;
  subject: string;
  setting: string;
  composition: string;
  lighting: string;
  visualStyle: string;
  aspectRatio: string;
  includeText: boolean;
  prompt: string;
  altText: string;
  placement: string;
}

export interface GeneratedBlog {
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  metaTitle: string;
  metaDescription: string;
  faq: FaqItem[];
  cta: string;
  category: string;
  tags: string[];
  imageSuggestions: ImageSuggestion[];
  internalLinkSuggestions: string[];
  externalSourceSuggestions: string[];
}

export interface BlogOutline {
  workingTitle: string;
  angle: string;
  sections: { heading: string; summary: string }[];
  faqQuestions: string[];
}

export interface SeoFields {
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  slug: string;
}

export interface ReviewFinding {
  severity: "info" | "warning";
  excerpt: string;
  issue: string;
  suggestion: string;
}

export interface ReviewResult {
  clean: boolean;
  findings: ReviewFinding[];
}

export interface MedicalReviewResult extends ReviewResult {
  sources: { claim: string; url: string }[];
}

export interface GenerationSettings {
  targetWordCount: number;
  tone: string;
  language: string;
  includeFaq: boolean;
  includeCta: boolean;
  includeInternalLinks: boolean;
  includeExternalSources: boolean;
  includeImageSuggestions: boolean;
  followHouseStyle: boolean;
}

export interface BlogRequest {
  topic: string;
  category: string;
  audience: string;
  instructions: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  settings: GenerationSettings;
  profile: ContentProfile | null;
  references: RetrievedArticle[];
  outline: BlogOutline | null;
}

export interface TopicRequest {
  count: number;
  categories: string[];
  profile: ContentProfile | null;
  existingTitles: string[];
  instructions: string;
}

export interface ProviderInfo {
  provider: string;
  model: string;
  topicsModel?: string;
}

export interface AIProvider {
  readonly info: ProviderInfo;

  analyseBlogs(items: CorpusItem[]): Promise<ContentProfile>;

  generateTopicCandidates(request: TopicRequest): Promise<TopicCandidate[]>;

  generateBlogPlan(request: BlogRequest): Promise<BlogPlan>;

  generateCompleteBlog(request: BlogRequest, plan: BlogPlan | null): Promise<GeneratedBlog>;

  reviewCompleteBlog(
    body: string,
    profile: ContentProfile | null,
    references: { title: string; extract: string }[],
  ): Promise<CombinedReview>;
}

export class AIError extends Error {
  constructor(
    message: string,
    readonly step: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIError";
  }
}

export class AIRateLimitError extends AIError {
  readonly code = "AI_RATE_LIMITED";
  constructor(
    step: string,
    readonly retryAfterMs: number,
    readonly daily = false,
    provider = "Gemini",
  ) {
    super(
      daily
        ? `${provider}'s daily request quota is used up. It resets at midnight Pacific time — try again in approximately ${formatWait(retryAfterMs)}.`
        : `${provider} is temporarily rate-limited. Try again in approximately ${formatWait(retryAfterMs)}.`,
      step,
    );
    this.name = "AIRateLimitError";
  }
}

export function formatWait(ms: number): string {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  if (seconds < 90) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hours ${rest} minutes` : `${hours} hours`;
}

export class AIUnavailableError extends AIError {
  readonly code = "AI_UNAVAILABLE";
  constructor(
    message: string,
    step: string,
    readonly retryAfterMs: number | null,
  ) {
    super(message, step);
    this.name = "AIUnavailableError";
  }
}

export function aiErrorResponse(
  error: unknown,
  fallback: string,
): { status: number; body: { error: { code: string; message: string; retryAfterMs?: number } } } {
  if (error instanceof AIRateLimitError) {
    return {
      status: 429,
      body: { error: { code: error.code, message: error.message, retryAfterMs: error.retryAfterMs } },
    };
  }
  if (error instanceof AIUnavailableError) {
    return {
      status: 503,
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...(error.retryAfterMs ? { retryAfterMs: error.retryAfterMs } : {}),
        },
      },
    };
  }
  const message = error instanceof Error ? error.message : fallback;
  return { status: 502, body: { error: { code: "AI_FAILED", message: message || fallback } } };
}

export interface BlogPlan {
  searchIntent: string;
  angle: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  outline: { heading: string; summary: string }[];
  faqPlan: string[];
  ctaPlan: string;
  imageConcepts: string[];
  seoStrategy: string;
  category: string;
}

export interface CombinedReview {
  clean: boolean;
  medical: ReviewFinding[];
  originality: ReviewFinding[];
  style: ReviewFinding[];
  grammar: ReviewFinding[];
  language: ReviewFinding[];
  sources: { claim: string; url: string }[];
}
