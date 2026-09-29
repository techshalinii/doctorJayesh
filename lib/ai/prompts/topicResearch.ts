import { PRACTICE_CONTEXT } from "./shared";
import type { TopicRequest } from "@/lib/ai/types";

export const TOPIC_MIX = `
Aim for a spread across these kinds of article, where the site's own gaps make it sensible:
- an evergreen educational topic (what something is, how it works)
- a symptom or problem the reader is searching because it is happening to them
- a question patients actually ask in clinic
- an authority or seasonal topic that shows current practice
`.trim();

export function buildTopicResearchPrompt(request: TopicRequest): string {
  const { profile, existingTitles, categories, count, instructions } = request;

  return `
${PRACTICE_CONTEXT}

${
  profile
    ? `Known content gaps: ${profile.topicIntelligence.contentGaps.join("; ") || "(none recorded)"}
Subjects already covered heavily — do not propose these: ${
        profile.topicIntelligence.topicsToAvoid.join("; ") || "(none recorded)"
      }`
    : ""
}

Articles this site already has (${existingTitles.length}). Do not propose a topic that
substantially overlaps any of them:
${existingTitles.map((t) => `- ${t}`).join("\n")}

${categories.length ? `Use only these categories: ${categories.join(", ")}` : ""}

${TOPIC_MIX}

${instructions ? `Additional instruction from the editor: ${instructions}` : ""}

Propose exactly ${count} candidate topics. For each, give the focus keyword a patient would
actually type, 2–4 secondary keywords, the search intent, the gap it fills in one short
sentence, and why it is worth writing now in one short sentence. Keep every field brief.

aiEstimate is your own 0–100 judgement of how valuable the topic is for this practice. It
will be shown to the editor labelled "AI Estimate". You have no search-volume data and no
keyword-difficulty data — do not imply that you do, and do not produce numbers that look
like traffic figures.
`.trim();
}
