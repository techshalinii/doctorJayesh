/**
 * Rule-based SEO scoring for the SEO title and meta description.
 *
 * Deterministic by design: the same input always produces the same score, and every
 * point is attributable to a named rule that carries its own justification. Nothing
 * here guesses, and nothing calls a model — the AI in the Suggest panel only ever
 * proposes WORDING, and whatever it proposes is re-scored by this module before the
 * author is offered it.
 *
 * Pure and dependency-free, so the editor scores on every keystroke and the tests
 * run without a database.
 */

export type ScoreBand = "good" | "needs-work" | "poor";

export interface RuleResult {
  id: string;
  /** Short name, shown in the checklist. */
  label: string;
  /** What is actually true of the current value — measured, not adjectival. */
  problem: string;
  /** The rule and the reason behind it. Shown verbatim in the Suggest panel. */
  why: string;
  points: number;
  max: number;
  passed: boolean;
  /**
   * Set when a rule could not be evaluated because no focus keyword was given.
   * The UI shows a prompt for one rather than pretending the rule failed on merit.
   */
  needsKeyword?: boolean;
}

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  length: number;
  /** The ideal character window, for the counter under the field. */
  ideal: { min: number; max: number };
  rules: RuleResult[];
}

/** Context the uniqueness and relevance rules need. */
export interface ScoreContext {
  /** The post's own H1 / working title. */
  pageTitle: string;
  focusKeyword: string;
  excerpt?: string;
  /** SEO titles already used by OTHER posts. */
  otherTitles?: readonly string[];
  /** Meta descriptions already used by OTHER posts. */
  otherDescriptions?: readonly string[];
}

export function bandOf(score: number): ScoreBand {
  if (score >= 80) return "good";
  if (score >= 50) return "needs-work";
  return "poor";
}

export const BAND_LABEL: Record<ScoreBand, string> = {
  good: "Good",
  "needs-work": "Needs work",
  poor: "Poor",
};

/* ── shared helpers ─────────────────────────────────────────────────────────── */

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Whole-phrase match, so "disc" does not match "discuss". */
function containsPhrase(haystack: string, phrase: string): boolean {
  const p = norm(phrase);
  if (!p) return false;
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(norm(haystack));
}

function countPhrase(haystack: string, phrase: string): number {
  const p = norm(phrase);
  if (!p) return 0;
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (norm(haystack).match(new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "gi")) ?? []).length;
}

const SEPARATORS = /[|–—:]|(?:\s-\s)/g;

/**
 * Shouting, as distinct from an acronym.
 *
 * A neurosurgery site legitimately writes MRI, CT, DBS, ACDF, TLIF and ALIF, so a flat
 * "any run of capitals" test would fire on real clinical vocabulary. Two narrower
 * signals instead:
 *
 *   - a word of five or more capitals (URGENT, AMAZING) — longer than any abbreviation
 *     in use here;
 *   - two or more all-caps words in a row (MUST READ), which no acronym produces.
 */
const LONG_CAPS = /\b[A-Z]{5,}\b/;
const CONSECUTIVE_CAPS = /\b[A-Z]{2,}\b[^A-Za-z0-9]+\b[A-Z]{2,}\b/;

function isShouting(text: string): boolean {
  return LONG_CAPS.test(text) || CONSECUTIVE_CAPS.test(text);
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "in", "is", "it",
  "of", "on", "or", "that", "the", "this", "to", "was", "what", "when", "which", "why",
  "with", "you", "your",
]);

function contentWords(text: string): string[] {
  return norm(text)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/* ── vocabulary ─────────────────────────────────────────────────────────────── */

const POWER_WORDS = [
  "proven", "essential", "complete", "ultimate", "expert", "safe", "safer", "fast", "faster",
  "simple", "clear", "best", "top", "guide", "checklist", "honest", "new", "advanced",
  "minimally", "painless", "quick", "real", "common", "critical", "key",
];

const BENEFIT_SIGNALS = [
  "how to", "what to expect", "when to", "why", "vs", "versus", "without", "avoid", "reduce",
  "prevent", "recover", "recovery", "relief", "risks", "risk", "symptoms", "causes", "options",
  "treatment", "signs", "difference", "explained",
];

const CTA_VERBS = [
  "learn", "discover", "find out", "get", "see", "understand", "explore", "know", "read",
  "book", "compare", "avoid", "reduce", "prevent", "choose", "spot", "recognise", "recognize",
  "decide", "check", "identify", "manage", "plan", "prepare",
];

const BOILERPLATE = [
  "welcome to", "this blog", "this article", "in this post", "read more about",
  "we are a leading", "best in class", "one stop", "click here", "our website",
  "lorem ipsum",
];

/** be-verb followed by a past participle — the usual passive-voice tell. */
const PASSIVE = /\b(is|are|was|were|be|been|being|can be|will be|has been|have been)\s+\w+(ed|en)\b/i;

/* ── SEO title ──────────────────────────────────────────────────────────────── */

export const TITLE_IDEAL = { min: 50, max: 60 } as const;

export function scoreSeoTitle(value: string, ctx: ScoreContext): ScoreResult {
  const title = value.trim();
  const len = title.length;
  const keyword = ctx.focusKeyword.trim();
  const rules: RuleResult[] = [];

  /* 1 — length ------------------------------------------------------------- */
  let lengthPoints = 0;
  if (len >= 50 && len <= 60) lengthPoints = 30;
  else if ((len >= 40 && len <= 49) || (len >= 61 && len <= 65)) lengthPoints = 20;
  else if ((len >= 30 && len <= 39) || (len >= 66 && len <= 70)) lengthPoints = 10;

  rules.push({
    id: "title-length",
    label: "Length 50–60 characters",
    problem:
      len === 0
        ? "SEO title is empty."
        : `SEO title is ${len} character${len === 1 ? "" : "s"}.`,
    why:
      "Google truncates the title at roughly 600px — about 60 characters — and appends an " +
      "ellipsis. Under about 30 characters wastes space it would have shown you for free. " +
      "Aim for 50–60.",
    points: lengthPoints,
    max: 30,
    passed: lengthPoints === 30,
  });

  /* 2 — keyword present ---------------------------------------------------- */
  const hasKeyword = Boolean(keyword) && containsPhrase(title, keyword);
  rules.push({
    id: "title-keyword",
    label: "Focus keyword present",
    problem: !keyword
      ? "No focus keyword set."
      : hasKeyword
        ? `Contains “${keyword}”.`
        : `“${keyword}” does not appear in the title.`,
    why:
      "The title is the strongest on-page signal of what the page is about. The query you " +
      "are targeting has to appear in it, or the page competes for it by accident.",
    points: hasKeyword ? 25 : 0,
    max: 25,
    passed: hasKeyword,
    ...(keyword ? {} : { needsKeyword: true }),
  });

  /* 3 — keyword position --------------------------------------------------- */
  const keywordAt = keyword ? norm(title).indexOf(norm(keyword)) : -1;
  const early = keywordAt >= 0 && keywordAt < 30;
  rules.push({
    id: "title-keyword-position",
    label: "Keyword in the first 30 characters",
    problem: !keyword
      ? "No focus keyword set."
      : keywordAt < 0
        ? "Keyword is absent, so it has no position."
        : early
          ? `Keyword starts at character ${keywordAt + 1}.`
          : `Keyword starts at character ${keywordAt + 1}, past the first 30.`,
    why:
      "Earlier words carry more weight and are the part that survives truncation on mobile " +
      "and in a narrow SERP layout. Put the query near the front.",
    points: keywordAt < 0 ? 0 : early ? 15 : 5,
    max: 15,
    passed: early,
    ...(keyword ? {} : { needsKeyword: true }),
  });

  /* 4 — uniqueness --------------------------------------------------------- */
  const clashesWithOther = (ctx.otherTitles ?? []).some((t) => norm(t) === norm(title) && norm(t) !== "");
  const copiesH1 = Boolean(title) && norm(title) === norm(ctx.pageTitle);
  const unique = Boolean(title) && !clashesWithOther && !copiesH1;
  rules.push({
    id: "title-unique",
    label: "Unique, not a copy of the H1",
    problem: !title
      ? "SEO title is empty."
      : clashesWithOther
        ? "Another post already uses this exact SEO title."
        : copiesH1
          ? "SEO title is a verbatim copy of the post's H1."
          : "Distinct from other posts and from the H1.",
    why:
      "Two pages with the same title compete with each other for the same query and dilute " +
      "both. Repeating the H1 also wastes the one chance to write for the SERP rather than " +
      "for the page.",
    points: unique ? 10 : 0,
    max: 10,
    passed: unique,
  });

  /* 5 — number, power word or benefit -------------------------------------- */
  const hasNumber = /\d/.test(title);
  const power = POWER_WORDS.find((w) => containsPhrase(title, w));
  const benefit = BENEFIT_SIGNALS.find((w) => containsPhrase(title, w));
  const compelling = hasNumber || Boolean(power) || Boolean(benefit);
  rules.push({
    id: "title-compelling",
    label: "Number, power word or clear benefit",
    problem: compelling
      ? hasNumber
        ? "Contains a number."
        : `Contains “${power ?? benefit}”.`
      : "No number, power word or benefit phrase.",
    why:
      "A title that promises something concrete is clicked more often than a bare topic " +
      "label. A count, a comparison or an outcome is enough — this is about clarity, not " +
      "clickbait.",
    points: compelling ? 10 : 0,
    max: 10,
    passed: compelling,
  });

  /* 6 — no stuffing, no shouting, at most one separator --------------------- */
  const keywordCount = keyword ? countPhrase(title, keyword) : 0;
  const stuffed = keywordCount >= 3;
  const shouting = isShouting(title);
  const separators = (title.match(SEPARATORS) ?? []).length;
  const clean = !stuffed && !shouting && separators <= 1;
  rules.push({
    id: "title-clean",
    label: "No stuffing, no ALL-CAPS, ≤1 separator",
    problem: stuffed
      ? `“${keyword}” appears ${keywordCount} times.`
      : shouting
        ? "Contains an ALL-CAPS word."
        : separators > 1
          ? `Uses ${separators} separators.`
          : "Clean.",
    why:
      "Repeating the keyword, shouting, or chaining three clauses with pipes and dashes all " +
      "lower click-through rate, and stuffing can be treated as manipulation.",
    points: clean ? 10 : 0,
    max: 10,
    passed: clean,
  });

  const score = rules.reduce((sum, r) => sum + r.points, 0);
  return { score, band: bandOf(score), length: len, ideal: TITLE_IDEAL, rules };
}

/* ── meta description ───────────────────────────────────────────────────────── */

export const DESCRIPTION_IDEAL = { min: 120, max: 160 } as const;

export function scoreMetaDescription(value: string, ctx: ScoreContext): ScoreResult {
  const desc = value.trim();
  const len = desc.length;
  const keyword = ctx.focusKeyword.trim();
  const rules: RuleResult[] = [];

  /* 1 — length ------------------------------------------------------------- */
  let lengthPoints = 0;
  if (len >= 120 && len <= 160) lengthPoints = 30;
  else if ((len >= 70 && len <= 119) || (len >= 161 && len <= 170)) lengthPoints = 15;

  rules.push({
    id: "desc-length",
    label: "Length 120–160 characters",
    problem: len === 0 ? "Meta description is empty." : `Meta description is ${len} characters.`,
    why:
      "Google renders about 920px on desktop — roughly 155–160 characters — and about 120 on " +
      "mobile. Anything longer is cut off mid-sentence, which usually amputates the call to " +
      "action; anything much shorter leaves free space unused. Aim for 120–160.",
    points: lengthPoints,
    max: 30,
    passed: lengthPoints === 30,
  });

  /* 2 — keyword present ---------------------------------------------------- */
  const hasKeyword = Boolean(keyword) && containsPhrase(desc, keyword);
  rules.push({
    id: "desc-keyword",
    label: "Focus keyword present",
    problem: !keyword
      ? "No focus keyword set."
      : hasKeyword
        ? `Contains “${keyword}”.`
        : `“${keyword}” does not appear in the description.`,
    why:
      "Google bolds the words from the searcher's query inside the snippet. A description " +
      "carrying the query is visually louder in the results page, which lifts click-through.",
    points: hasKeyword ? 25 : 0,
    max: 25,
    passed: hasKeyword,
    ...(keyword ? {} : { needsKeyword: true }),
  });

  /* 3 — value proposition / call to action --------------------------------- */
  const verb = CTA_VERBS.find((v) => containsPhrase(desc, v));
  const benefit = BENEFIT_SIGNALS.find((b) => containsPhrase(desc, b));
  const hasCta = Boolean(verb) && Boolean(benefit);
  rules.push({
    id: "desc-cta",
    label: "Value proposition or call to action",
    problem: hasCta
      ? `Has “${verb}” and promises “${benefit}”.`
      : verb
        ? `Has the verb “${verb}” but no concrete outcome.`
        : benefit
          ? `Names “${benefit}” but has no action verb.`
          : "No action verb and no concrete outcome.",
    why:
      "The description is not indexed copy — its only job is to earn the click. That needs a " +
      "verb telling the reader what they will do and a benefit telling them what they get.",
    points: hasCta ? 20 : 0,
    max: 20,
    passed: hasCta,
  });

  /* 4 — specific and active ------------------------------------------------ */
  const boilerplate = BOILERPLATE.find((b) => containsPhrase(desc, b));
  const passive = PASSIVE.test(desc);
  const titleWords = new Set(contentWords(ctx.pageTitle));
  const overlap = contentWords(desc).filter((w) => titleWords.has(w)).length;
  const onTopic = titleWords.size === 0 || overlap > 0;
  const specific = Boolean(desc) && !boilerplate && !passive && onTopic;
  rules.push({
    id: "desc-specific",
    label: "Specific and active voice",
    problem: !desc
      ? "Meta description is empty."
      : boilerplate
        ? `Contains the filler phrase “${boilerplate}”.`
        : passive
          ? "Written in the passive voice."
          : !onTopic
            ? "Shares no wording with the post's title, so it could describe any page."
            : "Specific and active.",
    why:
      "Google rewrites descriptions it judges generic, and a rewritten snippet is rarely the " +
      "one you would have chosen. Describing THIS page in the active voice is what keeps your " +
      "wording in the results.",
    points: specific ? 15 : 0,
    max: 15,
    passed: specific,
  });

  /* 5 — uniqueness --------------------------------------------------------- */
  const duplicate = (ctx.otherDescriptions ?? []).some((d) => norm(d) === norm(desc) && norm(d) !== "");
  const unique = Boolean(desc) && !duplicate;
  rules.push({
    id: "desc-unique",
    label: "Unique across pages",
    problem: !desc
      ? "Meta description is empty."
      : duplicate
        ? "Another post already uses this exact description."
        : "Distinct from other posts.",
    why:
      "Google drops duplicate descriptions and substitutes its own text, so a repeated one is " +
      "effectively no description at all.",
    points: unique ? 10 : 0,
    max: 10,
    passed: unique,
  });

  const score = rules.reduce((sum, r) => sum + r.points, 0);
  return { score, band: bandOf(score), length: len, ideal: DESCRIPTION_IDEAL, rules };
}
