import { PRACTICE_CONTEXT } from "./shared";
import type { CorpusItem } from "@/lib/ai/types";

function describe(item: CorpusItem): string {
  return [
    `--- ${item.source.toUpperCase()} · /${item.slug}/`,
    `Title: ${item.title}`,
    item.seoTitle && item.seoTitle !== item.title ? `SEO title: ${item.seoTitle}` : "",
    item.metaDescription ? `Meta: ${item.metaDescription}` : "",
    item.focusKeyword ? `Focus keyword: ${item.focusKeyword}` : "",
    item.categories.length ? `Categories: ${item.categories.join(", ")}` : "",
    item.tags.length ? `Tags: ${item.tags.slice(0, 8).join(", ")}` : "",
    item.imageAlt ? `Featured image alt: ${item.imageAlt}` : "",
    `Words: ${item.wordCount}${item.hasFaq ? " · has FAQ" : ""}`,
    item.publishedAt ? `Published: ${item.publishedAt.slice(0, 10)}` : "",
    item.body ? `Extract:\n${item.body}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAnalysePrompt(items: CorpusItem[]): string {
  return `
${PRACTICE_CONTEXT}

Below are ${items.length} articles from this site — a representative sample of everything
published. Read them and describe the patterns you find. You are building a reusable
style and topic profile that will be handed to later writing tasks in place of the
articles themselves, so be specific and concrete. "Professional and informative" is
useless; "opens by naming the symptom the reader is searching for, then says what it is
not" is useful.

For topicsToAvoid, list subjects this site has covered so thoroughly that another article
would compete with an existing one. For contentGaps, list subjects a practice like this
would be expected to cover that are missing or thin here.

Base every statement on what is actually in the sample. Do not speculate about what the
practice might want.

${items.map(describe).join("\n\n")}
`.trim();
}
