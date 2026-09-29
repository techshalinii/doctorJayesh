export function buildGrammarReviewPrompt(body: string): string {
  return `
Proofread this draft. Report only mechanical errors: spelling, subject-verb agreement,
punctuation, duplicated or missing words, broken markdown.

Do not comment on style, tone, structure or word choice — a different pass covers those,
and a proofreading list padded with preferences gets skimmed and then ignored.

Quote the sentence, name the error, give the correction.

Draft:
${body.slice(0, 20000)}
`.trim();
}
