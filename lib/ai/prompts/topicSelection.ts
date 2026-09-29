import { PRACTICE_CONTEXT } from "./shared";
import { TOPIC_MIX } from "./topicResearch";
import type { TopicCandidate } from "@/lib/ai/types";

export function buildTopicSelectionPrompt(
  candidates: TopicCandidate[],
  count: number,
): string {
  return `
${PRACTICE_CONTEXT}

Here are ${candidates.length} candidate topics:

${candidates
  .map(
    (c, i) =>
      `${i + 1}. ${c.topic}\n   keyword: ${c.focusKeyword}\n   intent: ${c.intent}\n   gap: ${c.contentGap}`,
  )
  .join("\n")}

Choose the ${count} strongest. ${TOPIC_MIX}

Two candidates that would rank for the same query are worth less than two that cover
different ground, even if the second is the weaker topic on its own. Return the chosen
candidates unchanged apart from aiEstimate, which you may revise now that you are
comparing them against each other.
`.trim();
}
