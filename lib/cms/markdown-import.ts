import { load as parseYaml } from "js-yaml";
import type { Block, FaqItem } from "@/lib/cms/types";
import { readTimeFromBlocks, blocksToPlainText } from "@/lib/cms/blocks";

/**
 * Markdown → editor fields.
 *
 * Runs in the browser when the author pastes or drops a `.md` file, so it depends on
 * nothing but `js-yaml` (already a dependency for the migrated content loader).
 *
 * Two metadata carriers are accepted, because both are in use:
 *   1. YAML frontmatter between `---` fences.
 *   2. A leading HTML comment block of `Key: value` lines, which is what the drafts
 *      written for this site actually carry:
 *
 *        <!--
 *        SEO title: Bulging Disc vs Herniated Disc: Causes and Treatment
 *        Meta description: Learn the difference…
 *        Primary query: bulging disc vs herniated disc
 *        -->
 *
 * Frontmatter wins on conflict, being the more explicit of the two.
 *
 * One rule is deliberate and load-bearing: `seo_title` is taken ONLY from an explicit
 * SEO-title line. It is never back-filled from the H1 — a title written for the page
 * and a title written for the search result are different jobs, and silently copying
 * one into the other is how every page ends up with a duplicate.
 */

export interface ImportedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: Block[];
  featured_image: string | null;
  image_alt: string;
  category: string;
  tags: string[];
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
  canonical_url: string | null;
  author: string;
  read_time: number;
  related_blogs: string[];
  faq: FaqItem[];
  /** What could not be filled, for the import summary shown to the author. */
  warnings: string[];
}

/* ── key aliases ────────────────────────────────────────────────────────────── */

const ALIASES: Record<string, string> = {
  title: "title",
  h1: "title",
  slug: "slug",
  url: "slug",
  permalink: "slug",
  excerpt: "excerpt",
  summary: "excerpt",
  description: "excerpt",
  "seo title": "seo_title",
  seotitle: "seo_title",
  seo_title: "seo_title",
  "title tag": "seo_title",
  "meta title": "seo_title",
  "meta description": "meta_description",
  metadescription: "meta_description",
  meta_description: "meta_description",
  "primary query": "focus_keyword",
  "focus keyword": "focus_keyword",
  focus_keyword: "focus_keyword",
  keyword: "focus_keyword",
  "target keyword": "focus_keyword",
  category: "category",
  categories: "category",
  tags: "tags",
  keywords: "tags",
  author: "author",
  image: "featured_image",
  "featured image": "featured_image",
  featured_image: "featured_image",
  "image alt": "image_alt",
  image_alt: "image_alt",
  alt: "image_alt",
  canonical: "canonical_url",
  canonical_url: "canonical_url",
  related: "related_blogs",
  related_blogs: "related_blogs",
  "related posts": "related_blogs",
};

function canonicalKey(raw: string): string | null {
  return ALIASES[raw.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ")] ?? ALIASES[raw.trim().toLowerCase()] ?? null;
}

/* ── metadata extraction ────────────────────────────────────────────────────── */

interface Extracted {
  meta: Record<string, unknown>;
  body: string;
}

function extractFrontmatter(source: string): Extracted {
  const match = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(source);
  if (!match) return { meta: {}, body: source };
  let parsed: unknown;
  try {
    parsed = parseYaml(match[1]);
  } catch {
    return { meta: {}, body: source };
  }
  const meta: Record<string, unknown> = {};
  if (parsed && typeof parsed === "object") {
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const key = canonicalKey(k);
      if (key) meta[key] = v;
    }
  }
  return { meta, body: source.slice(match[0].length) };
}

/** A LEADING `<!-- Key: value -->` block only — comments further down are content. */
function extractCommentBlock(source: string): Extracted {
  const match = /^\s*<!--([\s\S]*?)-->\s*/.exec(source);
  if (!match) return { meta: {}, body: source };

  const meta: Record<string, unknown> = {};
  let recognised = 0;
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^\s*([A-Za-z][A-Za-z _-]*?)\s*:\s*(.+?)\s*$/.exec(line);
    if (!pair) continue;
    const key = canonicalKey(pair[1]);
    if (!key) continue;
    meta[key] = pair[2];
    recognised++;
  }
  // A comment that held nothing we understand is prose, not metadata — leave it in
  // the body so the block stripper handles it rather than eating a real note.
  if (recognised === 0) return { meta: {}, body: source };
  return { meta, body: source.slice(match[0].length) };
}

/* ── value coercion ─────────────────────────────────────────────────────────── */

const asString = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

function asList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => asString(x)).filter(Boolean);
  const s = asString(v);
  if (!s) return [];
  return s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
}

/** `/bulging-disc/`, `https://site/bulging-disc/` and `bulging-disc` all reduce alike. */
export function toSlug(value: string): string {
  let s = value.trim();
  const url = /^https?:\/\/[^/]+(\/.*)$/.exec(s);
  if (url) s = url[1];
  s = s.replace(/^\/+|\/+$/g, "").split("/").pop() ?? "";
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/* ── body → blocks ──────────────────────────────────────────────────────────── */

const TABLE_DIVIDER = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

/** Blank lines, `---` rules and setext underlines all end a paragraph run. */
export function markdownToBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flush();
      continue;
    }

    // fenced code
    const fence = /^```+\s*([A-Za-z0-9+#-]*)\s*$/.exec(trimmed);
    if (fence) {
      flush();
      const language = fence[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```+\s*$/.test(lines[i].trim())) body.push(lines[i++]);
      blocks.push({ type: "code", code: body.join("\n"), ...(language ? { language } : {}) });
      continue;
    }

    // horizontal rule — checked before lists so `***` is not read as emphasis
    if (/^([-*_])\1{2,}$/.test(trimmed.replace(/\s/g, ""))) {
      flush();
      blocks.push({ type: "divider" });
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flush();
      const level = Math.min(heading[1].length, 3) as 1 | 2 | 3;
      blocks.push({ type: "heading", level, text: stripInlineWrappers(heading[2]) });
      continue;
    }

    // standalone image
    const image = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/.exec(trimmed);
    if (image) {
      flush();
      blocks.push({
        type: "image",
        src: image[2],
        alt: image[1],
        ...(image[3] ? { caption: image[3] } : {}),
      });
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flush();
      const quote: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ""));
      i--;
      blocks.push({ type: "quote", text: quote.join(" ").trim() });
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(trimmed);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (bullet || numbered) {
      flush();
      const ordered = Boolean(numbered);
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = ordered ? /^\d+[.)]\s+(.*)$/.exec(t) : /^[-*+]\s+(.*)$/.exec(t);
        if (!m) break;
        items.push(m[1].trim());
        i++;
      }
      i--;
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    // table: a header row followed by a divider row
    if (trimmed.includes("|") && i + 1 < lines.length && TABLE_DIVIDER.test(lines[i + 1])) {
      flush();
      const header = splitRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(splitRow(lines[i++]));
      i--;
      blocks.push({ type: "table", header, rows });
      continue;
    }

    paragraph.push(trimmed);
  }
  flush();
  return blocks;
}

/** `**Heading**` / `__Heading__` used as a heading — keep the words, drop the marks. */
function stripInlineWrappers(text: string): string {
  return text.replace(/^\s*(\*\*|__)(.+?)\1\s*$/, "$2").trim();
}

/* ── sections ───────────────────────────────────────────────────────────────── */

interface SectionSplit {
  body: string;
  faq: string | null;
  related: string | null;
}

/**
 * Pull the `## FAQ` and `## Related` sections out of the body.
 *
 * Matched at any heading level and by several spellings, since drafts are written by
 * hand. Everything up to the next heading of the SAME level belongs to the section.
 */
function splitSections(markdown: string): SectionSplit {
  const lines = markdown.split("\n");
  const body: string[] = [];
  let faq: string[] | null = null;
  let related: string[] | null = null;
  let current: "body" | "faq" | "related" = "body";
  let sectionLevel = 0;

  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (heading) {
      const level = heading[1].length;
      const name = heading[2].replace(/[*_`#:]/g, "").trim().toLowerCase();

      if (/^(faq|faqs|frequently asked questions)$/.test(name)) {
        current = "faq";
        sectionLevel = level;
        faq = [];
        continue;
      }
      if (/^(related|related (posts|blogs|articles|reading)|read next|in this series)$/.test(name)) {
        current = "related";
        sectionLevel = level;
        related = [];
        continue;
      }
      // A heading at or above the section's own level ends it.
      if (current !== "body" && level <= sectionLevel) current = "body";
    }

    if (current === "faq" && faq) faq.push(line);
    else if (current === "related" && related) related.push(line);
    else body.push(line);
  }

  return {
    body: body.join("\n"),
    faq: faq ? faq.join("\n") : null,
    related: related ? related.join("\n") : null,
  };
}

/**
 * FAQ items from a section.
 *
 * Questions are written two ways in practice — as a sub-heading, or as a bold line —
 * and in the bold form the answer usually starts on the NEXT line. Both are handled;
 * everything between one question and the next is the answer.
 */
export function parseFaqSection(section: string): FaqItem[] {
  const lines = section.replace(/\r\n/g, "\n").split("\n");
  const items: FaqItem[] = [];
  let question: string | null = null;
  let answer: string[] = [];

  const push = () => {
    const a = answer.join(" ").replace(/\s+/g, " ").trim();
    if (question && a) items.push({ question, answer: a });
    question = null;
    answer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const heading = /^#{1,6}\s+(.*)$/.exec(trimmed);
    // A bold line is a question when it is the WHOLE line, or when it is followed on
    // the same line by the answer.
    const bold = /^(?:\*\*|__)(.+?)(?:\*\*|__)\s*:?\s*(.*)$/.exec(trimmed);
    // "Q: …" / "Q. …"
    const qPrefix = /^Q\s*[.:)]\s*(.+)$/i.exec(trimmed);

    if (heading) {
      push();
      question = stripInlineWrappers(heading[1]);
      continue;
    }
    if (qPrefix) {
      push();
      question = qPrefix[1].trim();
      continue;
    }
    if (bold && (bold[1].includes("?") || !bold[2])) {
      push();
      question = bold[1].trim();
      if (bold[2]) answer.push(bold[2].trim());
      continue;
    }

    if (question) answer.push(trimmed.replace(/^A\s*[.:)]\s*/i, "").replace(/^[-*+]\s+/, ""));
  }
  push();
  return items;
}

/** Slugs from a Related section: list items, links or bare paths. */
export function parseRelatedSection(section: string): string[] {
  const out: string[] = [];
  for (const line of section.split("\n")) {
    const trimmed = line.trim().replace(/^[-*+]\s+/, "");
    if (!trimmed || /^#{1,6}\s/.test(trimmed)) continue;
    const link = /\[[^\]]*\]\(([^)\s]+)\)/.exec(trimmed);
    const value = link ? link[1] : trimmed;
    const slug = toSlug(value);
    if (slug && !out.includes(slug)) out.push(slug);
  }
  return out;
}

/* ── the import ─────────────────────────────────────────────────────────────── */

/** Sentence-aware trim to a target length, for a generated excerpt. */
function firstSentences(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (stop > max * 0.5) return cut.slice(0, stop + 1).trim();
  return `${cut.slice(0, cut.lastIndexOf(" ")).trim()}…`;
}

export function importMarkdown(source: string): ImportedPost {
  const warnings: string[] = [];

  // Comment block first: it sits above the frontmatter when both are present.
  const fromComment = extractCommentBlock(source);
  const fromFrontmatter = extractFrontmatter(fromComment.body);
  const meta = { ...fromComment.meta, ...fromFrontmatter.meta };

  // Any remaining HTML comments are editorial notes, never content.
  const cleaned = fromFrontmatter.body.replace(/<!--[\s\S]*?-->/g, "");

  const sections = splitSections(cleaned);
  const blocks = markdownToBlocks(sections.body);

  // The H1 titles the PAGE. It is used for `title` and nothing else.
  const firstHeading = blocks.find((b) => b.type === "heading" && b.level === 1);
  const title = asString(meta.title) || (firstHeading?.type === "heading" ? firstHeading.text : "");

  // Drop that H1 from the body: every route renders its own <h1>, so keeping it
  // would produce two — the same rule lib/content.ts applies to migrated posts.
  const content = firstHeading ? blocks.filter((b) => b !== firstHeading) : blocks;

  const plain = blocksToPlainText(content);
  const excerpt = asString(meta.excerpt) || firstSentences(plain, 180);

  const seoTitle = asString(meta.seo_title);
  if (!seoTitle) {
    warnings.push(
      "No “SEO title:” line found. Left blank on purpose — an SEO title is written for the " +
        "search result, not copied from the H1.",
    );
  }

  const metaDescription = asString(meta.meta_description);
  if (!metaDescription) warnings.push("No “Meta description:” line found.");

  const focusKeyword = asString(meta.focus_keyword);
  if (!focusKeyword) {
    warnings.push("No “Primary query:” line found — the keyword SEO rules cannot be scored without one.");
  }

  const related = [
    ...asList(meta.related_blogs).map(toSlug),
    ...(sections.related ? parseRelatedSection(sections.related) : []),
  ].filter((slug, i, arr) => slug && arr.indexOf(slug) === i);

  const faq = sections.faq ? parseFaqSection(sections.faq) : [];
  if (sections.faq && faq.length === 0) {
    warnings.push("An FAQ section was found but no question/answer pairs could be read from it.");
  }

  const featuredFromBody = content.find((b) => b.type === "image");
  const featured = asString(meta.featured_image);

  return {
    title,
    slug: toSlug(asString(meta.slug) || title),
    excerpt,
    content,
    featured_image:
      featured || (featuredFromBody?.type === "image" ? featuredFromBody.src : null) || null,
    image_alt:
      asString(meta.image_alt) || (featuredFromBody?.type === "image" ? featuredFromBody.alt : ""),
    category: asString(meta.category),
    tags: asList(meta.tags),
    seo_title: seoTitle,
    meta_description: metaDescription,
    focus_keyword: focusKeyword,
    canonical_url: asString(meta.canonical_url) || null,
    author: asString(meta.author),
    read_time: readTimeFromBlocks(content),
    related_blogs: related,
    faq,
    warnings,
  };
}
