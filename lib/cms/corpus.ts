import type { CorpusItem } from "@/lib/ai/types";

export const EXTRACT_CHARS = 900;

export const ANALYSIS_SAMPLE_SIZE = 45;

export function wordCount(text: string): number {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

export function analysisSample(
  corpus: CorpusItem[],
  size = ANALYSIS_SAMPLE_SIZE,
): CorpusItem[] {
  const fromCms = corpus.filter((i) => i.source === "supabase");
  const migrated = corpus.filter((i) => i.source === "markdown");

  const room = Math.max(0, size - fromCms.length);
  if (migrated.length <= room) return [...fromCms, ...migrated];

  const stride = migrated.length / room;
  const spread = Array.from({ length: room }, (_, i) => migrated[Math.floor(i * stride)]);

  return [...fromCms, ...spread];
}

export function existingTitles(corpus: CorpusItem[], limit = 120): string[] {
  return [...corpus]
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, limit)
    .map((item) => item.title);
}

export function neighbouringTitles(
  topic: string,
  corpus: CorpusItem[],
  limit = 8,
): string[] {
  const words = new Set(
    topic.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3),
  );
  if (!words.size) return [];

  return corpus
    .map((item) => {
      const title = item.title.toLowerCase();
      let hits = 0;
      for (const word of words) if (title.includes(word)) hits++;
      return { title: item.title, hits };
    })
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map((entry) => entry.title);
}

export function safeSlug(
  desired: string,
  taken: Iterable<string>,
  reserved: Iterable<string> = [],
): string {
  const used = new Set<string>([...taken, ...reserved]);
  const base = desired || "post";
  if (!used.has(base)) return base;

  for (let i = 2; i < 500; i++) {
    const candidate = `${base}-${i}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}
