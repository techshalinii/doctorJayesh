import { PRACTICE_CONTEXT, describeProfile, describeSeoPatterns, MEDICAL_RULES } from "./shared";
import { ORIGINALITY_RULES } from "./blogGeneration";
import type { BlogRequest } from "@/lib/ai/types";
import type { RetrievedArticle } from "@/lib/ai/retrieval";

export function buildPlanningPrompt(request: BlogRequest): string {
  const { topic, category, audience, instructions, focusKeyword, secondaryKeywords, settings, profile, references } = request;

  return `
ROLE
${PRACTICE_CONTEXT}

HOUSE STYLE
${settings.followHouseStyle ? describeProfile(profile) : `Plan for a ${settings.tone} tone.`}

${describeSeoPatterns(profile)}

REQUEST
Topic: ${topic}
Category: ${category || "(choose the best fit)"}
Audience: ${audience || "patients and their families"}
${focusKeyword ? `Focus keyword supplied by the editor: ${focusKeyword}` : "No focus keyword supplied — choose one a patient would actually search."}
${secondaryKeywords.length ? `Secondary keywords supplied: ${secondaryKeywords.join(", ")}` : ""}
Target length: about ${settings.targetWordCount} words
${instructions ? `Editor's instructions: ${instructions}` : ""}

${describeReferences(references)}

WHAT TO RETURN
Plan the article in one response:

- searchIntent: what someone typing this query actually wants.
- angle: the specific take this article should have, in one sentence. If the references
  above already cover the subject, say how this one differs.
- focusKeyword and secondaryKeywords: what a patient would type. Keep the editor's if
  supplied.
- outline: the H2 sections in order, each with a line on what it covers. Size the section
  count to ${settings.targetWordCount} words — roughly 200–300 words of body each. Do not
  plan a section you would have to pad.
${settings.includeFaq ? "- faqPlan: the 4–6 questions the FAQ should answer." : "- faqPlan: empty."}
${settings.includeCta ? "- ctaPlan: one line on what the closing call to action should do." : "- ctaPlan: empty."}
${settings.includeImageSuggestions ? "- imageConcepts: one featured concept and 2–4 supporting ones, described in a phrase each." : "- imageConcepts: empty."}
- seoStrategy: one line on how the keyword should sit in the title, opening and headings.

${MEDICAL_RULES}
`.trim();
}

function describeReferences(references: RetrievedArticle[]): string {
  if (!references.length) return "";
  return `
RELEVANT PREVIOUS ARTICLES
${references.map((r) => `- "${r.title}" (/${r.slug}/, ${r.source})\n  ${r.extract}`).join("\n")}

${ORIGINALITY_RULES}
`.trim();
}
