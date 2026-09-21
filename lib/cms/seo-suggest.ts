import {
  DESCRIPTION_IDEAL,
  TITLE_IDEAL,
  scoreMetaDescription,
  scoreSeoTitle,
  type ScoreContext,
  type ScoreResult,
} from "@/lib/cms/seo-score";

/**
 * Rewrite options for the Suggest panel.
 *
 * Two generators, same contract: every option they return is re-scored by
 * lib/cms/seo-score.ts before the author sees it, and the score travels with the
 * option so the panel can show a ✓ against each rule it satisfies. Nothing is
 * offered on the strength of having been generated.
 *
 * The deterministic generator here is the floor — it needs no API key, no network
 * and no model, and it is what the panel falls back to. `/api/seo-suggest` may
 * produce better WORDING with a model, but it is bound by the same rules: its
 * output goes through `rankOptions()` exactly like these candidates do.
 */

export interface SuggestOption {
  text: string;
  score: ScoreResult;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "of", "on", "or", "the",
  "to", "vs", "with",
]);

/** Headline-style capitalisation. First and last word always capitalised. */
function titleCase(text: string): string {
  const words = text.trim().split(/\s+/);
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i > 0 && i < words.length - 1 && SMALL_WORDS.has(lower)) return lower;
      // Leave deliberate capitalisation alone (MRI, CT) rather than flattening it.
      if (/^[A-Z]{2,3}$/.test(w)) return w;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "for", "from", "has", "have",
  "how", "in", "is", "it", "its", "of", "on", "or", "our", "that", "the", "their", "there",
  "these", "they", "this", "to", "was", "we", "what", "when", "which", "who", "why", "will",
  "with", "you", "your",
]);

/**
 * Salient words from the post's own title and excerpt, keyword words removed.
 *
 * This is what keeps a generated option GROUNDED: every suggestion is assembled from
 * the focus keyword plus vocabulary the post itself already uses, never from a
 * generic phrase bank alone.
 */
function topicWords(ctx: ScoreContext): string[] {
  const keywordWords = new Set(norm(ctx.focusKeyword).split(/\s+/));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const word of norm(`${ctx.pageTitle} ${ctx.excerpt ?? ""}`)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)) {
    if (word.length < 4 || STOP.has(word) || keywordWords.has(word) || seen.has(word)) continue;
    seen.add(word);
    out.push(word);
  }
  return out;
}

/** Drop whole words off the end until the text fits, so nothing is cut mid-word. */
function trimToWords(text: string, max: number): string {
  if (text.length <= max) return text;
  const words = text.split(" ");
  while (words.length > 1 && words.join(" ").length > max) words.pop();
  return words.join(" ").replace(/[\s,;:—–-]+$/, "");
}

function rankOptions(
  candidates: string[],
  score: (text: string) => ScoreResult,
  limit = 3,
): SuggestOption[] {
  const seen = new Set<string>();
  const scored: SuggestOption[] = [];
  for (const raw of candidates) {
    const text = raw.replace(/\s+/g, " ").trim();
    if (!text || seen.has(norm(text))) continue;
    seen.add(norm(text));
    scored.push({ text, score: score(text) });
  }
  scored.sort((a, b) => b.score.score - a.score.score);

  // Prefer options that actually pass. Only if too few do, fall back to the best
  // available — shown with their real ✓/✗ so the author is never told a failing
  // option passes.
  const passing = scored.filter((o) => o.score.band === "good");
  return (passing.length >= limit ? passing : scored).slice(0, limit);
}

/* ── SEO title ──────────────────────────────────────────────────────────────── */

/**
 * Tail clauses, each carrying at least one benefit signal the scorer recognises
 * ("causes", "symptoms", "treatment", "signs", "risks", "options", "recovery",
 * "what to expect", "explained", "how to"). `%s` takes a grounded topic word.
 */
const TITLE_TAILS = [
  "Causes, Symptoms and Treatment",
  "Signs, Risks and Treatment Options",
  "What to Expect Before and After Surgery",
  "How to Spot the Signs Early",
  "Symptoms, Causes and When to Worry",
  "Treatment Options and Recovery Explained",
  "%s Symptoms and Treatment Explained",
  "Causes, %s and Recovery",
  "A Patient Guide to Symptoms and Recovery",
  "Warning Signs You Should Not Ignore",
];

/** Counted openers, so at least some candidates satisfy the "number" rule. */
const TITLE_COUNTED = [
  "5 Signs of %k You Should Not Ignore",
  "7 Things to Know About %k Before Surgery",
  "4 %k Symptoms That Need a Specialist",
  "6 %k Treatment Options, Explained Simply",
];

export function suggestSeoTitles(ctx: ScoreContext): SuggestOption[] {
  const keyword = ctx.focusKeyword.trim();
  if (!keyword) return [];

  const head = titleCase(keyword);
  const topics = topicWords(ctx);
  const candidates: string[] = [];

  for (const tail of TITLE_TAILS) {
    const filled = tail.includes("%s")
      ? topics.length
        ? tail.replace("%s", titleCase(topics[0]))
        : null
      : tail;
    if (!filled) continue;

    let text = `${head}: ${filled}`;

    // Too long: shorten the tail, never the keyword — it must stay in the first 30.
    if (text.length > TITLE_IDEAL.max) {
      text = trimToWords(text, TITLE_IDEAL.max);
    }
    // Too short: extend with the post's own vocabulary rather than filler.
    for (let i = 0; text.length < TITLE_IDEAL.min && i < topics.length; i++) {
      const extended = `${text} and ${titleCase(topics[i])}`;
      if (extended.length > TITLE_IDEAL.max) break;
      text = extended;
    }
    candidates.push(text);
  }

  for (const template of TITLE_COUNTED) {
    let text = template.replace("%k", head);
    if (text.length > TITLE_IDEAL.max) text = trimToWords(text, TITLE_IDEAL.max);
    candidates.push(text);
  }

  return rankOptions(candidates, (text) => scoreSeoTitle(text, ctx));
}

/* ── meta description ───────────────────────────────────────────────────────── */

/**
 * Openers pairing a CTA verb with a concrete outcome — the two halves the
 * `desc-cta` rule looks for. `%k` takes the focus keyword verbatim so the keyword
 * rule passes without the phrase being mangled by capitalisation.
 */
const DESC_OPENERS = [
  "Learn what %k means, the symptoms to watch for and when to see a specialist.",
  "Understand %k — the common causes, the warning signs and the treatment options that help.",
  "Find out how %k is diagnosed, what recovery involves and how to reduce your risk.",
  "Discover the signs of %k, what to expect from treatment and when surgery is the right choice.",
  "Compare treatment options for %k, understand the risks and see what recovery really looks like.",
  "Know the early symptoms of %k, the causes behind them and the treatment that brings relief.",
];

/** Grounded tails, appended only when an opener lands short of 120 characters. */
const DESC_TAILS = [
  "Written by a consultant neurosurgeon.",
  "Clear, practical guidance for patients and families.",
  "Explained in plain language, without the jargon.",
  "Includes what to ask at your consultation.",
];

export function suggestMetaDescriptions(ctx: ScoreContext): SuggestOption[] {
  const keyword = ctx.focusKeyword.trim();
  if (!keyword) return [];

  const candidates: string[] = [];

  for (const opener of DESC_OPENERS) {
    let text = opener.replace("%k", keyword);

    if (text.length > DESCRIPTION_IDEAL.max) {
      text = `${trimToWords(text, DESCRIPTION_IDEAL.max - 1)}.`;
    }
    // Short: add a grounded tail, then a second one if it still falls short.
    for (const tail of DESC_TAILS) {
      if (text.length >= DESCRIPTION_IDEAL.min) break;
      const extended = `${text} ${tail}`;
      if (extended.length <= DESCRIPTION_IDEAL.max) text = extended;
    }
    candidates.push(text);
  }

  return rankOptions(candidates, (text) => scoreMetaDescription(text, ctx));
}

/* ── the prompt the AI path uses ────────────────────────────────────────────── */

/**
 * The rules are stated as hard constraints, so the model is choosing WORDING inside
 * a box the scorer already agrees with rather than inventing its own idea of good.
 * Whatever comes back is still re-scored before it is offered.
 */
export function buildSuggestPrompt(kind: "title" | "description", ctx: ScoreContext): string {
  const shared =
    `Page title: ${ctx.pageTitle}\n` +
    `What the page is about: ${ctx.excerpt ?? ctx.pageTitle}\n` +
    `Target keyword: ${ctx.focusKeyword}\n\n`;

  if (kind === "title") {
    return (
      `${shared}Rewrite the SEO title for this page. Return exactly 3 options, one per line, ` +
      `nothing else — no numbering, no quotes, no commentary.\n\n` +
      `Every option must:\n` +
      `- be between ${TITLE_IDEAL.min} and ${TITLE_IDEAL.max} characters\n` +
      `- contain "${ctx.focusKeyword}" within the first 30 characters\n` +
      `- contain a number, a power word, or a clear benefit\n` +
      `- use at most one separator (: or —)\n` +
      `- use no ALL-CAPS words\n` +
      `- not repeat the keyword more than twice\n` +
      `- not be identical to the page title above`
    );
  }

  return (
    `${shared}Rewrite the meta description for this page. Return exactly 3 options, one per ` +
    `line, nothing else — no numbering, no quotes, no commentary.\n\n` +
    `Every option must:\n` +
    `- be between ${DESCRIPTION_IDEAL.min} and ${DESCRIPTION_IDEAL.max} characters\n` +
    `- contain "${ctx.focusKeyword}"\n` +
    `- start with or contain an action verb (Learn, Understand, Discover, Find out, Compare)\n` +
    `- name a concrete outcome (symptoms, causes, treatment, recovery, risks, options)\n` +
    `- be in the active voice and describe THIS page specifically\n` +
    `- avoid filler such as "welcome to", "this article" or "click here"`
  );
}

/** Score model output the same way, so nothing bypasses the rules. */
export function rankSuggestions(
  kind: "title" | "description",
  texts: string[],
  ctx: ScoreContext,
): SuggestOption[] {
  return rankOptions(texts, (text) =>
    kind === "title" ? scoreSeoTitle(text, ctx) : scoreMetaDescription(text, ctx),
  );
}
