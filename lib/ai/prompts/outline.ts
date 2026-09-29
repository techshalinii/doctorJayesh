import { PRACTICE_CONTEXT, describeProfile, MEDICAL_RULES } from "./shared";
import type { BlogRequest } from "@/lib/ai/types";

export function buildOutlinePrompt(request: BlogRequest): string {
  const { topic, category, audience, instructions, focusKeyword, settings, profile } = request;

  return `
${PRACTICE_CONTEXT}

${describeProfile(profile)}

Plan an article.

Topic: ${topic}
Category: ${category || "(choose the best fit)"}
Audience: ${audience || "patients and their families"}
Focus keyword: ${focusKeyword || "(choose one a patient would search)"}
Target length: about ${settings.targetWordCount} words
Tone: ${settings.tone}
${instructions ? `Editor's instructions: ${instructions}` : ""}

Return a working title, the angle in a sentence, and the H2 sections in order with a line
each on what they cover. ${settings.includeFaq ? "Also propose the FAQ questions." : "No FAQ is needed."}

The section count should suit ${settings.targetWordCount} words — roughly 200–300 words of
body per section. Do not plan a section you would have to pad.

${MEDICAL_RULES}
`.trim();
}
