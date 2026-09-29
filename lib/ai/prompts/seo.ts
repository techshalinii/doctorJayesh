import { PRACTICE_CONTEXT, SEO_TARGETS } from "./shared";

export function buildSeoPrompt(title: string, body: string, keyword: string): string {
  return `
${PRACTICE_CONTEXT}

Write the search metadata for this article.

Title: ${title}
Focus keyword: ${keyword || "(derive one from the article)"}

Article (truncated):
${body.slice(0, 6000)}

${SEO_TARGETS}

Describe what the article actually contains. No hyperbole, no "ultimate guide", and no
claim the article does not support. Also return a slug and up to six secondary keywords
that are genuinely distinct from the focus keyword.
`.trim();
}
