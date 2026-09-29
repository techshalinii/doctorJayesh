import { PRACTICE_CONTEXT, describeProfile } from "./shared";
import type { ContentProfile } from "@/lib/ai/types";

export function buildCombinedReviewPrompt(
  body: string,
  profile: ContentProfile | null,
  references: { title: string; extract: string }[],
): string {
  return `
${PRACTICE_CONTEXT}

${describeProfile(profile)}

Review the draft below and report what a human should look at before it is published.
Cover all of these in one pass, and put each finding in the right category:

- medical: any figure, rate, timeframe, effectiveness claim or statement presented as
  settled that a clinician would want to verify — and anything that reads as advice to
  act rather than as information.
- originality: any passage that reads as reproduced or closely paraphrased from the
  reference articles below, or that reads as boilerplate lifted from elsewhere.
- style: where it drifts from the house style above — tone, heading shape, jargon left
  unexplained, padding this site does not write.
- grammar: mechanical errors only. Spelling, agreement, punctuation, duplicated or
  missing words, broken markdown.
- language: where a patient would not follow it, or where a term needs translating.

For each finding, quote the sentence, say what the problem is, and say what would fix it.

Do not invent sources. Populate "sources" only with a reference you are certain exists
and can name accurately; an empty array is a perfectly good answer, and a fabricated
citation on a medical page is worse than none.

Return empty categories where you found nothing. Do not manufacture findings to look
thorough — a clean draft should come back clean.

${
  references.length
    ? `REFERENCE ARTICLES (for the originality check only):\n${references
        .map((r) => `- "${r.title}": ${r.extract}`)
        .join("\n")}`
    : ""
}

DRAFT
${body.slice(0, 24000)}
`.trim();
}
