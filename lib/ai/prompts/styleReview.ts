import { describeProfile } from "./shared";
import type { ContentProfile } from "@/lib/ai/types";

export function buildStyleReviewPrompt(body: string, profile: ContentProfile | null): string {
  return `
${describeProfile(profile)}

Read this draft against that house style and report where it drifts: a tone that is more
salesy or more clinical than the site's, headings shaped differently, an opening or closing
that breaks the usual pattern, jargon left unexplained where this site would explain it,
or padding this site does not write.

Quote the passage, say how it differs, and say what it should be instead.

If the draft is consistent with the style, return an empty findings array. Do not
manufacture findings to look thorough.

Draft:
${body.slice(0, 20000)}
`.trim();
}
