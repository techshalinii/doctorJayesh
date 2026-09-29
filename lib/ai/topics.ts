import type { TopicCandidate } from "@/lib/ai/types";

export const EXTRA_CANDIDATES = 2;

export function candidatePoolSize(count: number): number {
  return count + EXTRA_CANDIDATES;
}

export function selectBalancedTopics(
  candidates: TopicCandidate[],
  count: number,
): TopicCandidate[] {
  if (candidates.length <= count) return [...candidates];

  const byIntent = new Map<string, TopicCandidate[]>();
  for (const candidate of [...candidates].sort((a, b) => b.aiEstimate - a.aiEstimate)) {
    byIntent.set(candidate.intent, [...(byIntent.get(candidate.intent) ?? []), candidate]);
  }

  const picked: TopicCandidate[] = [];
  while (picked.length < count) {
    let tookOne = false;
    for (const queue of byIntent.values()) {
      const next = queue.shift();
      if (!next) continue;
      picked.push(next);
      tookOne = true;
      if (picked.length === count) break;
    }
    if (!tookOne) break;
  }

  return picked;
}
