import { PRACTICE_CONTEXT } from "./shared";
import type { ContentProfile } from "@/lib/ai/types";

export function buildImagePrompt(
  title: string,
  body: string,
  profile: ContentProfile | null,
): string {
  const p = profile?.imagePatterns;

  return `
${PRACTICE_CONTEXT}

Propose images for this article.

Title: ${title}

Article (truncated):
${body.slice(0, 4000)}

${
  p
    ? `Match the site's existing image style:
- Style: ${p.style}
- Composition: ${p.composition}
- Subject: ${p.subject}
- Realism: ${p.realism}
- Aspect ratio: ${p.aspectRatio}
- Text in images: ${p.textPolicy}
- Featured images specifically: ${p.featuredImageStyle}`
    : ""
}

Give one featured image and 2–4 supporting images. For each: the concept, subject,
setting, composition, lighting, visual style, aspect ratio, whether it carries text, a
prompt ready to paste into an image generator, alt text, and where in the article it goes.

Alt text describes the image for someone who cannot see it. It is not a caption and not a
place for keywords.

This is medical content: no image should depict a recognisable real patient, imply a
specific outcome, or show a procedure in a way that reads as gore.
`.trim();
}
