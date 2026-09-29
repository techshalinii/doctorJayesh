import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).default("");

const clamped = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .transform((value) => {
      if (value.length <= max) return value;
      const cut = value.slice(0, max);
      const lastSpace = cut.lastIndexOf(" ");
      return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
    });

export const faqItemSchema = z.object({
  question: clamped(300),
  answer: clamped(2000),
});

export const contentProfileSchema = z.object({
  writingStyle: z.object({
    tone: text(400),
    vocabulary: text(400),
    sentenceStructure: text(400),
    paragraphStructure: text(400),
    introductionStyle: text(400),
    conclusionStyle: text(400),
    headingPatterns: text(400),
    faqStyle: text(400),
    ctaStyle: text(400),
    medicalTerminology: text(400),
    patientFriendlyLanguage: text(400),
    typicalWordCount: z.number().int().min(100).max(10000),
  }),
  topicIntelligence: z.object({
    clusters: z.array(z.object({ name: text(120), topics: z.array(text(200)).max(30) })).max(20),
    coveredTopics: z.array(text(200)).max(200),
    contentGaps: z.array(text(200)).max(60),
    topicsToAvoid: z.array(text(200)).max(60),
    recentTopics: z.array(text(200)).max(60),
  }),
  seoPatterns: z.object({
    titlePatterns: z.array(text(200)).max(20),
    metaDescriptionPatterns: z.array(text(300)).max(20),
    keywordUsage: text(600),
    slugPatterns: text(400),
    headingStructure: text(600),
    internalLinking: text(600),
  }),
  imagePatterns: z.object({
    style: text(300),
    composition: text(300),
    subject: text(300),
    realism: text(300),
    aspectRatio: text(60),
    textPolicy: text(200),
    featuredImageStyle: text(400),
  }),
});

export const searchIntentSchema = z.enum([
  "informational",
  "symptom",
  "treatment",
  "comparison",
]);

export const topicCandidateSchema = z.object({
  topic: text(200),
  focusKeyword: text(120),
  secondaryKeywords: z.array(text(120)).max(12).default([]),
  intent: searchIntentSchema,
  contentGap: optionalText(400),
  reason: optionalText(600),
  aiEstimate: z.number().min(0).max(100).default(50),
  category: optionalText(120),
});

export const topicCandidatesSchema = z.object({
  candidates: z.array(topicCandidateSchema).min(1).max(30),
});

export const outlineSchema = z.object({
  workingTitle: text(200),
  angle: optionalText(600),
  sections: z
    .array(z.object({ heading: text(200), summary: optionalText(600) }))
    .min(1)
    .max(20),
  faqQuestions: z.array(text(300)).max(12).default([]),
});

export const imageSuggestionSchema = z.object({
  role: z.enum(["featured", "supporting"]),
  concept: clamped(400),
  subject: optionalText(300),
  setting: optionalText(300),
  composition: optionalText(300),
  lighting: optionalText(300),
  visualStyle: optionalText(300),
  aspectRatio: optionalText(60),
  includeText: z.boolean().default(false),
  prompt: clamped(2000),
  altText: clamped(300),
  placement: optionalText(200),
});

export const imageSuggestionsSchema = z.object({
  images: z.array(imageSuggestionSchema).min(1).max(6),
});

export const seoFieldsSchema = z.object({
  metaTitle: clamped(120),
  metaDescription: clamped(400),
  primaryKeyword: clamped(120),
  secondaryKeywords: z.array(clamped(120)).max(12).default([]),
  slug: clamped(120),
});

export const generatedBlogSchema = z.object({
  title: clamped(200),
  slug: clamped(120),
  excerpt: clamped(600),
  contentMarkdown: z.string().trim().min(200).max(80000),
  primaryKeyword: clamped(120),
  secondaryKeywords: z.array(clamped(120)).max(12).default([]),
  metaTitle: clamped(120),
  metaDescription: clamped(400),
  faq: z.array(faqItemSchema).max(12).default([]),
  cta: optionalText(1000),
  category: optionalText(120),
  tags: z.array(text(60)).max(15).default([]),
  imageSuggestions: z.array(imageSuggestionSchema).max(6).default([]),
  internalLinkSuggestions: z.array(text(300)).max(15).default([]),
  externalSourceSuggestions: z.array(text(300)).max(15).default([]),
});

export const reviewFindingSchema = z.object({
  severity: z.enum(["info", "warning"]).default("warning"),
  excerpt: optionalText(600),
  issue: text(600),
  suggestion: optionalText(600),
});

export const reviewResultSchema = z.object({
  findings: z.array(reviewFindingSchema).max(40).default([]),
});

export const medicalReviewSchema = z.object({
  findings: z.array(reviewFindingSchema).max(40).default([]),
  sources: z
    .array(z.object({ claim: text(400), url: z.string().trim().url().max(500) }))
    .max(20)
    .default([]),
});

export const duplicateRefinementSchema = z.object({
  matches: z
    .array(
      z.object({
        slug: text(200),
        score: z.number().min(0).max(1),
        reason: optionalText(400),
      }),
    )
    .max(20)
    .default([]),
});

export type ContentProfileShape = z.infer<typeof contentProfileSchema>;
export type GeneratedBlogShape = z.infer<typeof generatedBlogSchema>;

export const planningSchema = z.object({
  searchIntent: optionalText(300),
  angle: optionalText(600),
  focusKeyword: clamped(120),
  secondaryKeywords: z.array(clamped(120)).max(12).default([]),
  outline: z
    .array(z.object({ heading: clamped(200), summary: optionalText(600) }))
    .min(1)
    .max(20),
  faqPlan: z.array(clamped(300)).max(12).default([]),
  ctaPlan: optionalText(600),
  imageConcepts: z.array(clamped(400)).max(6).default([]),
  seoStrategy: optionalText(600),
  category: optionalText(120),
});

export const combinedReviewSchema = z.object({
  medical: z.array(reviewFindingSchema).max(30).default([]),
  originality: z.array(reviewFindingSchema).max(30).default([]),
  style: z.array(reviewFindingSchema).max(30).default([]),
  grammar: z.array(reviewFindingSchema).max(30).default([]),
  language: z.array(reviewFindingSchema).max(30).default([]),
  sources: z
    .array(z.object({ claim: clamped(400), url: z.string().trim().url().max(500) }))
    .max(20)
    .default([]),
});

export type PlanningShape = z.infer<typeof planningSchema>;
export type CombinedReviewShape = z.infer<typeof combinedReviewSchema>;
