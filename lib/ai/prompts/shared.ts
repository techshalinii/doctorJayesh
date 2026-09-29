import type { ContentProfile } from "@/lib/ai/types";

export const PRACTICE_CONTEXT = `
You are writing for the website of Dr. Jayesh Sardhara, a neurosurgeon and spine surgeon
practising in Mumbai, India. The audience is patients and their families — people who are
worried, not clinicians. The site covers brain surgery, spine surgery, minimally invasive
and endoscopic techniques, and the conditions those treat.
`.trim();

export const MEDICAL_RULES = `
Rules you must follow:
- Never invent statistics, study results, citations, or named sources. If you do not know
  a figure, write the sentence without one.
- Never promise an outcome, a recovery time, or a success rate.
- Never give dosing, and never tell a reader to start, stop or change a treatment.
- Write in a way that sends a reader with symptoms to a doctor rather than to a decision.
- Do not copy sentences from the existing articles you are shown. They are there to teach
  you voice and structure, not to be reused.
`.trim();

export function describeProfile(profile: ContentProfile | null): string {
  if (!profile) return "No house style profile is available. Write plainly and factually.";

  const s = profile.writingStyle;
  return `
House style, derived from this practice's existing articles:
- Tone: ${s.tone}
- Vocabulary: ${s.vocabulary}
- Sentences: ${s.sentenceStructure}
- Paragraphs: ${s.paragraphStructure}
- Openings: ${s.introductionStyle}
- Closings: ${s.conclusionStyle}
- Headings: ${s.headingPatterns}
- FAQ style: ${s.faqStyle}
- Call to action: ${s.ctaStyle}
- Medical terminology: ${s.medicalTerminology}
- Plain-language habit: ${s.patientFriendlyLanguage}
- Typical length: about ${s.typicalWordCount} words
`.trim();
}

export function describeSeoPatterns(profile: ContentProfile | null): string {
  if (!profile) return "";
  const p = profile.seoPatterns;
  return `
Existing SEO patterns on this site:
- Title patterns: ${p.titlePatterns.join(" | ") || "(none recorded)"}
- Meta description patterns: ${p.metaDescriptionPatterns.join(" | ") || "(none recorded)"}
- Keyword usage: ${p.keywordUsage}
- Slug patterns: ${p.slugPatterns}
`.trim();
}

export const SEO_TARGETS = `
- SEO title: 50–60 characters, with the focus keyword near the front.
- Meta description: 120–160 characters, with the focus keyword, and it must read as a
  sentence rather than a list of keywords.
- Slug: lowercase, hyphenated, no stop words, no dates, under 60 characters.
`.trim();
