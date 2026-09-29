import type { CorpusItem } from "@/lib/ai/types";
import { similarity, tokenise } from "@/lib/ai/similarity";

export interface RetrievedArticle {
  title: string;
  slug: string;
  source: "markdown" | "supabase";
  extract: string;
  score: number;
}

const EXTRACT_CHARS = 420;

const WEIGHTS = { title: 1, tags: 0.7, excerpt: 0.5, body: 0.35, keyword: 0.9 } as const;

function tagScore(topicWords: Set<string>, tags: string[]): number {
  if (!tags.length || !topicWords.size) return 0;
  const hits = tags.filter((tag) =>
    [...tokenise(tag)].some((word) => topicWords.has(word)),
  ).length;
  return Math.min(1, hits / Math.min(3, tags.length));
}

export function retrieveRelevant(
  topic: string,
  keyword: string,
  corpus: CorpusItem[],
  limit = 4,
): RetrievedArticle[] {
  const query = `${topic} ${keyword}`.trim();
  const topicWords = tokenise(query);
  if (!topicWords.size) return [];

  return corpus
    .map((item) => {
      const score =
        similarity(query, item.title) * WEIGHTS.title +
        tagScore(topicWords, item.tags) * WEIGHTS.tags +
        (item.excerpt ? similarity(query, item.excerpt) * WEIGHTS.excerpt : 0) +
        (item.body ? similarity(query, item.body) * WEIGHTS.body : 0) +
        (keyword && item.focusKeyword ? similarity(keyword, item.focusKeyword) * WEIGHTS.keyword : 0);

      return {
        title: item.title,
        slug: item.slug,
        source: item.source,
        extract: (item.excerpt || item.body).slice(0, EXTRACT_CHARS).trim(),
        score: Math.round(score * 100) / 100,
      };
    })
    .filter((entry) => entry.score >= 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function retrievalBreakdown(articles: RetrievedArticle[]): {
  markdown: number;
  supabase: number;
} {
  return {
    markdown: articles.filter((a) => a.source === "markdown").length,
    supabase: articles.filter((a) => a.source === "supabase").length,
  };
}
