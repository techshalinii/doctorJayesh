import { PRACTICE_CONTEXT } from "./shared";
import type { ContentProfile, CorpusItem } from "@/lib/ai/types";

export function buildProfileRefreshPrompt(
  previous: ContentProfile,
  added: CorpusItem[],
): string {
  return `
${PRACTICE_CONTEXT}

Here is the existing style and topic profile for this site:

${JSON.stringify(previous, null, 2)}

Since it was written, these articles were published:

${added
  .map((a) => `- ${a.title} (${a.categories.join(", ") || "uncategorised"}, ${a.wordCount} words)`)
  .join("\n")}

Return an updated profile. Keep everything the new articles do not contradict — this is an
update, not a rewrite. Move anything now well covered out of contentGaps and into
coveredTopics, refresh recentTopics, and add to topicsToAvoid where the new articles have
made a subject crowded.
`.trim();
}
