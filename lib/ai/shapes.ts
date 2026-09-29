import type { ContentProfile, CorpusItem } from "./types";

export type ResponseSchema = Record<string, unknown>;

const str = (description?: string): ResponseSchema => ({ type: "string", ...(description ? { description } : {}) });
const capped = (max: number, description?: string): ResponseSchema => ({
  type: "string",
  maxLength: max,
  ...(description ? { description } : {}),
});
const num = (): ResponseSchema => ({ type: "number" });
const bool = (): ResponseSchema => ({ type: "boolean" });
const arr = (items: ResponseSchema): ResponseSchema => ({ type: "array", items });
const obj = (properties: Record<string, ResponseSchema>, required?: string[]): ResponseSchema => ({
  type: "object",
  properties,
  ...(required ? { required } : {}),
});

export const PROFILE_SCHEMA = obj({
  writingStyle: obj({
    tone: str(), vocabulary: str(), sentenceStructure: str(), paragraphStructure: str(),
    introductionStyle: str(), conclusionStyle: str(), headingPatterns: str(), faqStyle: str(),
    ctaStyle: str(), medicalTerminology: str(), patientFriendlyLanguage: str(),
    typicalWordCount: num(),
  }),
  topicIntelligence: obj({
    clusters: arr(obj({ name: str(), topics: arr(str()) })),
    coveredTopics: arr(str()), contentGaps: arr(str()),
    topicsToAvoid: arr(str()), recentTopics: arr(str()),
  }),
  seoPatterns: obj({
    titlePatterns: arr(str()), metaDescriptionPatterns: arr(str()), keywordUsage: str(),
    slugPatterns: str(), headingStructure: str(), internalLinking: str(),
  }),
  imagePatterns: obj({
    style: str(), composition: str(), subject: str(), realism: str(),
    aspectRatio: str(), textPolicy: str(), featuredImageStyle: str(),
  }),
});

export const TOPIC_SCHEMA = obj({
  candidates: arr(
    obj({
      topic: str(), focusKeyword: str(), secondaryKeywords: arr(str()),
      intent: { type: "string", enum: ["informational", "symptom", "treatment", "comparison"] },
      contentGap: str(), reason: str(),
      aiEstimate: num(), category: str(),
    }),
  ),
});

const IMAGE_ITEM = obj({
  role: { type: "string", enum: ["featured", "supporting"] },
  concept: str(), subject: str(), setting: str(), composition: str(), lighting: str(),
  visualStyle: str(), aspectRatio: str(), includeText: bool(), prompt: str(),
  altText: str(), placement: str(),
});

export const BLOG_SCHEMA = obj({
  title: capped(200, "The article headline. One line."),
  slug: capped(120, "Lowercase, hyphenated, no stop words."),
  excerpt: capped(600, "One or two sentences summarising the article."),
  contentMarkdown: str("The full article body in markdown. Headings start at ##."),
  primaryKeyword: capped(120), secondaryKeywords: arr(capped(120)),
  metaTitle: capped(120, "50-60 characters."),
  metaDescription: capped(400, "120-160 characters."),
  faq: arr(obj({ question: str(), answer: str() })),
  cta: str(), category: str(), tags: arr(str()),
  imageSuggestions: arr(IMAGE_ITEM),
  internalLinkSuggestions: arr(str()), externalSourceSuggestions: arr(str()),
});

export const PLAN_SCHEMA = obj({
  searchIntent: str(), angle: str(),
  focusKeyword: capped(120), secondaryKeywords: arr(capped(120)),
  outline: arr(obj({ heading: capped(200), summary: str() })),
  faqPlan: arr(capped(300)), ctaPlan: str(),
  imageConcepts: arr(capped(400)), seoStrategy: str(), category: capped(120),
});

const FINDINGS = arr(
  obj({
    severity: { type: "string", enum: ["info", "warning"] },
    excerpt: str(), issue: str(), suggestion: str(),
  }),
);

export const REVIEW_SCHEMA = obj({
  medical: FINDINGS, originality: FINDINGS, style: FINDINGS,
  grammar: FINDINGS, language: FINDINGS,
  sources: arr(obj({ claim: str(), url: str() })),
});

export function withStats(
  shape: Omit<ContentProfile, "stats">,
  items: CorpusItem[],
): ContentProfile {
  return {
    ...shape,
    stats: {
      markdownPosts: items.filter((i) => i.source === "markdown").length,
      supabasePosts: items.filter((i) => i.source === "supabase").length,
      analysedAt: new Date().toISOString(),
    },
  };
}

export function safeJson(raw: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "invalid JSON" };
  }
}
