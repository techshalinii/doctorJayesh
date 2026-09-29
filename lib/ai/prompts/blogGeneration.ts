import { PRACTICE_CONTEXT, describeProfile, describeSeoPatterns, MEDICAL_RULES, SEO_TARGETS } from "./shared";
import type { BlogPlan, BlogRequest } from "@/lib/ai/types";
import type { RetrievedArticle } from "@/lib/ai/retrieval";

export const ORIGINALITY_RULES = `
The previous articles below are EDITORIAL REFERENCES, not source material.

Use them only to understand writing style, structure, terminology, topic coverage and
factual context. Write a new, original article addressing the requested topic.

- Do not reproduce, quote or closely paraphrase any sentence from them.
- Do not follow one of them section by section.
- Do not reuse their opening or closing lines.
- If the topic overlaps one of them, deliberately take a different angle.

Write the article in your own words, from your own understanding of the subject.
`.trim();

function references(articles: RetrievedArticle[]): string {
  if (!articles.length) return "";

  const group = (source: "markdown" | "supabase", label: string) => {
    const items = articles.filter((a) => a.source === source);
    if (!items.length) return "";
    return `
${label}
${items.map((a) => `- "${a.title}" (/${a.slug}/)\n  ${a.extract}`).join("\n")}`;
  };

  return `
RELEVANT PREVIOUS ARTICLES
${group("markdown", "From the site's existing published articles:")}
${group("supabase", "From articles created recently in the CMS:")}

${ORIGINALITY_RULES}
`.trim();
}

export function buildBlogPrompt(request: BlogRequest, plan: BlogPlan | null = null): string {
  const {
    topic, category, audience, instructions, settings, profile, references: retrieved,
  } = request;

  const focusKeyword = plan?.focusKeyword || request.focusKeyword;
  const secondaryKeywords = plan?.secondaryKeywords.length
    ? plan.secondaryKeywords
    : request.secondaryKeywords;

  return `
ROLE
${PRACTICE_CONTEXT}

HOUSE STYLE
${settings.followHouseStyle ? describeProfile(profile) : `Write in a ${settings.tone} tone.`}

${describeSeoPatterns(profile)}

REQUEST
Topic: ${topic}
Category: ${category || "(choose the best fit)"}
Audience: ${audience || "patients and their families"}
Focus keyword: ${focusKeyword || "(choose one a patient would search)"}
${secondaryKeywords.length ? `Secondary keywords: ${secondaryKeywords.join(", ")}` : ""}
Language: ${settings.language}
Target length: about ${settings.targetWordCount} words
${instructions ? `Editor's instructions: ${instructions}` : ""}

${
  plan
    ? `APPROVED PLAN — from the planning call. Follow it rather than re-deciding it.
Search intent: ${plan.searchIntent}
Angle: ${plan.angle}
${plan.seoStrategy ? `SEO strategy: ${plan.seoStrategy}` : ""}

Outline:
${plan.outline.map((section) => `## ${section.heading}\n   ${section.summary}`).join("\n")}
${plan.faqPlan.length ? `\nFAQ questions to answer:\n${plan.faqPlan.map((q) => `- ${q}`).join("\n")}` : ""}
${plan.ctaPlan ? `\nCall to action: ${plan.ctaPlan}` : ""}
${plan.imageConcepts.length ? `\nImage concepts — expand each into a full prompt and alt text:\n${plan.imageConcepts.map((c) => `- ${c}`).join("\n")}` : ""}`
    : ""
}

${references(retrieved)}

OUTPUT REQUIREMENTS
Body format — markdown only:
- "## " for sections and "### " for subsections. No H1: the title is a separate field.
- Short paragraphs. Lists where the content is genuinely a list.
- "**bold**", "*italic*" and [label](url) links are supported. Nothing else.
- Do not write an FAQ or a call to action inside the body; they are separate fields.

${settings.includeFaq ? "Include 4–6 FAQ items, in the practice's FAQ voice." : "Return an empty faq array."}
${settings.includeCta ? "Include a short closing call to action as the cta field." : "Leave cta empty."}
${
  settings.includeInternalLinks
    ? "In internalLinkSuggestions, name the previous articles above that this one should link to."
    : "Leave internalLinkSuggestions empty."
}
${
  settings.includeExternalSources
    ? `In externalSourceSuggestions, name the KIND of authoritative source that would support
the main claims — a professional body, a guideline. Name only sources you are certain
exist, and never invent a URL, a title or a study.`
    : "Leave externalSourceSuggestions empty."
}
${
  settings.includeImageSuggestions
    ? "Include a featured image suggestion and 2–4 supporting ones, each with a prompt and alt text."
    : "Return an empty imageSuggestions array."
}

SEO
${SEO_TARGETS}

MEDICAL CONTENT
${MEDICAL_RULES}
`.trim();
}
