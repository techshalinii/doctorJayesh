import { PRACTICE_CONTEXT } from "./shared";

export function buildMedicalReviewPrompt(body: string): string {
  return `
${PRACTICE_CONTEXT}

Read this draft and list any statement that a clinician would want to verify before it is
published: a figure, a rate, a timeframe, a claim about how effective something is, a
statement presented as settled that is actually contested, or anything that reads as
advice to act rather than as information.

Draft:
${body.slice(0, 20000)}

For each, quote the exact sentence, say what the problem is, and say what would make it
safe — usually softening it, attributing it, or removing the number.

Do not invent sources. Only populate "sources" with a reference you are certain exists and
can name accurately; if you are not certain, leave it out and the claim will be marked for
human verification instead. An empty sources array is a perfectly good answer.

If nothing needs verification, return an empty findings array.
`.trim();
}
