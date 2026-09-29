import type { CorpusItem, DuplicateMatch } from "@/lib/ai/types";

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from",
  "how", "in", "is", "it", "its", "of", "on", "or", "should", "that", "the", "this",
  "to", "what", "when", "why", "with", "you", "your",
  "doctor", "patient", "patients", "surgery", "surgeon", "treatment", "care", "mumbai",
]);

export function tokenise(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP.has(word)),
  );
}

export function similarity(a: string, b: string): number {
  const left = tokenise(a);
  const right = tokenise(b);
  if (!left.size || !right.size) return 0;

  let shared = 0;
  for (const word of left) if (right.has(word)) shared++;

  return shared / (left.size + right.size - shared);
}

export const DUPLICATE_THRESHOLD = 0.34;

export function findSimilar(
  topic: string,
  keyword: string,
  corpus: CorpusItem[],
  limit = 5,
): DuplicateMatch[] {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const matches: DuplicateMatch[] = [];

  for (const item of corpus) {
    const titleScore = similarity(topic, item.title);
    const excerptScore = item.excerpt ? similarity(topic, item.excerpt) * 0.6 : 0;
    const keywordScore =
      keyword && item.focusKeyword && similarity(keyword, item.focusKeyword) > 0.6 ? 0.85 : 0;
    const slugScore = item.slug === slug ? 1 : 0;

    const score = Math.max(titleScore, excerptScore, keywordScore, slugScore);
    if (score < DUPLICATE_THRESHOLD) continue;

    matches.push({
      title: item.title,
      slug: item.slug,
      url: `/${item.slug}/`,
      source: item.source,
      score: Math.round(score * 100) / 100,
      reason: reasonFor({ slugScore, keywordScore, titleScore, excerptScore }),
    });
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}

function reasonFor(scores: {
  slugScore: number;
  keywordScore: number;
  titleScore: number;
  excerptScore: number;
}): string {
  if (scores.slugScore) return "An article already lives at this URL.";
  if (scores.keywordScore) return "An existing article targets the same focus keyword.";
  if (scores.titleScore >= DUPLICATE_THRESHOLD) return "The titles cover substantially the same subject.";
  return "The existing article's summary covers this ground.";
}
