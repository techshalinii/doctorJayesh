import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isVisible, VISIBLE_STATUSES } from "@/lib/cms/visibility";
import { scoreMetaDescription, scoreSeoTitle, type ScoreContext } from "@/lib/cms/seo-score";
import { suggestMetaDescriptions, suggestSeoTitles } from "@/lib/cms/seo-suggest";
import { importMarkdown, toSlug } from "@/lib/cms/markdown-import";
import { renderBlocks, readTimeFromBlocks } from "@/lib/cms/blocks";
import { blocksToTiptap, tiptapToBlocks } from "@/lib/cms/tiptap";
import { wallTimeToUtc, utcToWallTime } from "@/lib/admin/timezone";
import type { Block } from "@/lib/cms/types";

/**
 * Acceptance tests for everything that can be checked without a database.
 *
 * Run with `npm test`. The DB-backed half of the acceptance list — a draft being
 * absent from the live site, Publish Now appearing within the cache window — lives in
 * tests/http.test.ts, which needs a configured Supabase project and a running server.
 */

const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

/* ── 1 & 2: the visibility rule ─────────────────────────────────────────────── */

describe("visibility rule", () => {
  it("only published and scheduled can ever be visible", () => {
    assert.deepEqual([...VISIBLE_STATUSES], ["published", "scheduled"]);
  });

  it("hides drafts, archived posts and future-scheduled posts (acceptance 1)", () => {
    assert.equal(isVisible({ status: "draft", publish_at: iso(-1000) }), false);
    assert.equal(isVisible({ status: "archived", publish_at: iso(-1000) }), false);
    assert.equal(isVisible({ status: "scheduled", publish_at: iso(60_000) }), false);
    assert.equal(isVisible({ status: "published", publish_at: iso(60_000) }), false);
  });

  it("a scheduled post becomes visible when the clock passes it (acceptance 2)", () => {
    const post = { status: "scheduled", publish_at: "2026-09-18T10:00:00.000Z" };

    assert.equal(isVisible(post, new Date("2026-09-18T09:59:59.000Z")), false);
    // Same row, no status change, no cron — only the clock moved.
    assert.equal(isVisible(post, new Date("2026-09-18T10:00:00.000Z")), true);
    assert.equal(isVisible(post, new Date("2026-09-19T00:00:00.000Z")), true);
  });

  it("a live status with no publish_at is not visible", () => {
    assert.equal(isVisible({ status: "published", publish_at: null }), false);
    assert.equal(isVisible({ status: "scheduled", publish_at: null }), false);
  });

  it("an unparseable publish_at is not visible", () => {
    assert.equal(isVisible({ status: "published", publish_at: "not a date" }), false);
  });
});

/* ── 8: SEO scoring ─────────────────────────────────────────────────────────── */

const ctx: ScoreContext = {
  pageTitle: "Bulging Disc vs Herniated Disc",
  focusKeyword: "bulging disc",
  excerpt: "The difference between a bulging disc and a herniated disc, and what each means for treatment.",
  otherTitles: [],
  otherDescriptions: [],
};

describe("SEO title scoring", () => {
  it("scores a 50-60 character keyword-leading title in the green band", () => {
    const value = "Bulging Disc: Causes, Symptoms and Treatment Options";
    const result = scoreSeoTitle(value, ctx);
    assert.ok(value.length >= 50 && value.length <= 60, `length was ${value.length}`);
    assert.equal(result.band, "good");
    assert.ok(result.score >= 80, `score was ${result.score}`);
  });

  it("gives zero length points beyond 70 characters", () => {
    const long = "Bulging Disc and Herniated Disc: Everything a Patient Could Possibly Need to Know";
    const rule = scoreSeoTitle(long, ctx).rules.find((r) => r.id === "title-length");
    assert.equal(rule?.points, 0);
  });

  it("awards no keyword points when the keyword is absent", () => {
    const rule = scoreSeoTitle("Spine Problems Explained", ctx).rules.find(
      (r) => r.id === "title-keyword",
    );
    assert.equal(rule?.points, 0);
  });

  it("scores a late keyword lower than an early one", () => {
    const early = scoreSeoTitle("Bulging Disc: Signs, Risks and Treatment Options", ctx);
    const late = scoreSeoTitle("A Patient Guide to Spine Pain and the Bulging Disc", ctx);
    const points = (r: typeof early) => r.rules.find((x) => x.id === "title-keyword-position")!.points;
    assert.equal(points(early), 15);
    assert.equal(points(late), 5);
  });

  it("flags a verbatim copy of the H1 as not unique", () => {
    const rule = scoreSeoTitle(ctx.pageTitle, ctx).rules.find((r) => r.id === "title-unique");
    assert.equal(rule?.passed, false);
  });

  it("flags a title another post already uses", () => {
    const taken = "Bulging Disc: Causes, Symptoms and Treatment Options";
    const rule = scoreSeoTitle(taken, { ...ctx, otherTitles: [taken] }).rules.find(
      (r) => r.id === "title-unique",
    );
    assert.equal(rule?.passed, false);
  });

  it("flags stuffing, shouting and separator pile-ups", () => {
    const stuffed = scoreSeoTitle("Bulging disc, bulging disc and bulging disc", ctx);
    const shouting = scoreSeoTitle("Bulging Disc: URGENT Signs and Treatment Options", ctx);
    const separators = scoreSeoTitle("Bulging Disc | Causes | Symptoms — Treatment", ctx);
    for (const result of [stuffed, shouting, separators]) {
      assert.equal(result.rules.find((r) => r.id === "title-clean")?.passed, false);
    }
  });

  it("marks keyword rules as needing a keyword rather than failing them on merit", () => {
    const result = scoreSeoTitle("Bulging Disc: Causes and Treatment", { ...ctx, focusKeyword: "" });
    const keywordRules = result.rules.filter((r) => r.needsKeyword);
    assert.equal(keywordRules.length, 2);
    assert.ok(keywordRules.every((r) => r.problem.includes("No focus keyword")));
  });

  it("is deterministic", () => {
    const value = "Bulging Disc: Causes, Symptoms and Treatment Options";
    assert.equal(scoreSeoTitle(value, ctx).score, scoreSeoTitle(value, ctx).score);
  });
});

describe("meta description scoring", () => {
  /**
   * Acceptance 8, reconciled with the rubric in §8b.
   *
   * The brief asks for a 212-character description to land in the RED band. Under the
   * point table it specifies, that is arithmetically impossible for a description whose
   * only fault is length: over-length forfeits the 30 length points and nothing else,
   * so an otherwise-good one scores 70 — amber. Red (<50) needs a second failure.
   *
   * The rubric is the feature and is implemented exactly as written; these two tests
   * assert what it actually produces. The substance of the acceptance check is intact:
   * an over-length description scores 0 on length, is flagged, and is below the "Good"
   * threshold that shows the Suggest button.
   */
  it("scores a 212-character description 0 on length and below Good (acceptance 8)", () => {
    const tooLong =
      "Learn about the difference between a bulging disc and a herniated disc, what causes each " +
      "of them, the symptoms you should watch for, the treatment options available to you, and " +
      "when it is time to see a specialist";
    assert.equal(tooLong.length, 212, `length was ${tooLong.length}`);

    const result = scoreMetaDescription(tooLong, ctx);
    const lengthRule = result.rules.find((r) => r.id === "desc-length")!;

    assert.equal(lengthRule.points, 0);
    assert.equal(lengthRule.passed, false);
    assert.match(lengthRule.problem, /212 characters/);
    assert.notEqual(result.band, "good");
    assert.ok(result.score < 80, `score was ${result.score}`);
  });

  it("reaches the red band when length and keyword both fail", () => {
    const tooLongNoKeyword =
      "Learn about the many different spinal conditions that can develop over time, what causes " +
      "each of them, the symptoms you should watch for, the options available to you, and when " +
      "it is time to talk to a surgeon";
    assert.ok(tooLongNoKeyword.length > 170);

    const result = scoreMetaDescription(tooLongNoKeyword, ctx);
    assert.equal(result.band, "poor");
    assert.ok(result.score < 50, `score was ${result.score}`);
  });

  it("scores a 120-160 character description with keyword and CTA in the green band", () => {
    const good =
      "Learn what a bulging disc is, the symptoms to watch for and the treatment options that " +
      "bring relief — and when to see a specialist.";
    const result = scoreMetaDescription(good, ctx);
    assert.ok(good.length >= 120 && good.length <= 160, `length was ${good.length}`);
    assert.equal(result.band, "good");
  });

  it("fails the CTA rule without an action verb", () => {
    const flat =
      "A bulging disc is a spinal condition affecting the outer layer of the disc, with symptoms " +
      "and treatment varying between patients in practice.";
    assert.equal(
      scoreMetaDescription(flat, ctx).rules.find((r) => r.id === "desc-cta")?.passed,
      false,
    );
  });

  it("fails the specific rule on boilerplate and on passive voice", () => {
    const boilerplate =
      "Welcome to our website. In this article we cover the bulging disc topic and explain what " +
      "you need to know about it in detail today.";
    const passive =
      "A bulging disc is diagnosed by a specialist and the symptoms are managed with physical " +
      "therapy, and surgery is recommended only rarely.";
    for (const value of [boilerplate, passive]) {
      assert.equal(
        scoreMetaDescription(value, ctx).rules.find((r) => r.id === "desc-specific")?.passed,
        false,
      );
    }
  });

  it("flags a description another post already uses", () => {
    const taken =
      "Learn what a bulging disc is, the symptoms to watch for and the treatment options that " +
      "bring relief — and when to see a specialist.";
    assert.equal(
      scoreMetaDescription(taken, { ...ctx, otherDescriptions: [taken] }).rules.find(
        (r) => r.id === "desc-unique",
      )?.passed,
      false,
    );
  });
});

/* ── 8: Suggest returns options that satisfy the rules ──────────────────────── */

describe("deterministic suggestions", () => {
  it("returns 3 title options, all 50-60 chars with the keyword up front (acceptance 8)", () => {
    const options = suggestSeoTitles(ctx);
    assert.equal(options.length, 3);
    for (const option of options) {
      assert.ok(
        option.text.length >= 50 && option.text.length <= 60,
        `"${option.text}" was ${option.text.length} chars`,
      );
      assert.ok(
        option.text.toLowerCase().indexOf(ctx.focusKeyword) >= 0,
        `"${option.text}" is missing the keyword`,
      );
      assert.ok(
        option.text.toLowerCase().indexOf(ctx.focusKeyword) < 30,
        `"${option.text}" has the keyword past character 30`,
      );
      assert.equal(option.score.band, "good");
    }
  });

  it("returns 3 description options, all 120-160 chars containing the keyword (acceptance 8)", () => {
    const options = suggestMetaDescriptions(ctx);
    assert.equal(options.length, 3);
    for (const option of options) {
      assert.ok(
        option.text.length >= 120 && option.text.length <= 160,
        `"${option.text}" was ${option.text.length} chars`,
      );
      assert.ok(
        option.text.toLowerCase().includes(ctx.focusKeyword),
        `"${option.text}" is missing the keyword`,
      );
      assert.equal(option.score.band, "good");
    }
  });

  it("offers nothing without a focus keyword rather than guessing one", () => {
    assert.deepEqual(suggestSeoTitles({ ...ctx, focusKeyword: "" }), []);
    assert.deepEqual(suggestMetaDescriptions({ ...ctx, focusKeyword: "" }), []);
  });

  it("every option it offers is re-scored, not asserted", () => {
    for (const option of suggestSeoTitles(ctx)) {
      assert.equal(option.score.score, scoreSeoTitle(option.text, ctx).score);
    }
  });
});

/* ── Markdown import ────────────────────────────────────────────────────────── */

const DRAFT = `<!--
SEO title: Bulging Disc: Causes, Symptoms and Treatment Options
Meta description: Learn what a bulging disc is and when to see a specialist.
Primary query: bulging disc
Category: Spine Surgery
Tags: spine, disc
-->

# Bulging Disc vs Herniated Disc

Back pain is common. <!-- editorial note -->

## What is a bulging disc?

The outer layer **stretches** but does not tear. See [our spine page](/spine-surgery/).

- Age-related wear
- Repetitive strain

| Type | Severity |
| --- | --- |
| Bulging | Mild |
| Herniated | Severe |

## FAQ

### Is a bulging disc serious?

Usually not. Most cases settle with conservative treatment.

**Do I need surgery?**
Rarely — only when there is nerve compression.

## Related

- [Slipped disc](/can-a-slipped-disc-affect-your-daily-life/)
- bulging-disc-vs-herniated-disc
`;

describe("markdown import", () => {
  const imported = importMarkdown(DRAFT);

  it("reads the comment block's metadata", () => {
    assert.equal(imported.seo_title, "Bulging Disc: Causes, Symptoms and Treatment Options");
    assert.equal(imported.meta_description, "Learn what a bulging disc is and when to see a specialist.");
    assert.equal(imported.focus_keyword, "bulging disc");
    assert.equal(imported.category, "Spine Surgery");
    assert.deepEqual(imported.tags, ["spine", "disc"]);
  });

  it("takes the title from the H1 and removes it from the body", () => {
    assert.equal(imported.title, "Bulging Disc vs Herniated Disc");
    assert.equal(
      imported.content.some((b) => b.type === "heading" && b.level === 1),
      false,
    );
  });

  it("NEVER back-fills the SEO title from the H1", () => {
    const withoutSeoTitle = importMarkdown("# A Heading\n\nSome body copy here.");
    assert.equal(withoutSeoTitle.title, "A Heading");
    assert.equal(withoutSeoTitle.seo_title, "");
    assert.ok(withoutSeoTitle.warnings.some((w) => w.includes("SEO title")));
  });

  it("strips HTML comments from the body", () => {
    assert.equal(renderBlocks(imported.content).includes("editorial note"), false);
  });

  it("parses headings, lists and tables into blocks", () => {
    const types = imported.content.map((b) => b.type);
    assert.ok(types.includes("heading"));
    assert.ok(types.includes("list"));
    assert.ok(types.includes("table"));
  });

  it("reads FAQ questions written as headings AND as bold lines", () => {
    assert.equal(imported.faq.length, 2);
    assert.equal(imported.faq[0].question, "Is a bulging disc serious?");
    assert.match(imported.faq[0].answer, /conservative treatment/);
    // Bold question whose answer is on the NEXT line.
    assert.equal(imported.faq[1].question, "Do I need surgery?");
    assert.match(imported.faq[1].answer, /nerve compression/);
  });

  it("reads related links from paths, links and bare slugs", () => {
    assert.deepEqual(imported.related_blogs, [
      "can-a-slipped-disc-affect-your-daily-life",
      "bulging-disc-vs-herniated-disc",
    ]);
  });

  it("reads YAML frontmatter too, and lets it win over the comment block", () => {
    const both = importMarkdown(
      `<!--\nSEO title: From the comment\n-->\n---\nseo_title: From the frontmatter\n---\n\nBody.\n`,
    );
    assert.equal(both.seo_title, "From the frontmatter");
  });

  it("normalises slugs from paths and URLs", () => {
    assert.equal(toSlug("/bulging-disc/"), "bulging-disc");
    assert.equal(toSlug("https://drjayeshsardhara.com/bulging-disc/"), "bulging-disc");
    assert.equal(toSlug("Bulging Disc vs. Herniated Disc"), "bulging-disc-vs-herniated-disc");
  });
});

/* ── rendering safety ───────────────────────────────────────────────────────── */

describe("block rendering", () => {
  it("escapes HTML in stored text (acceptance: stored content cannot inject markup)", () => {
    const blocks: Block[] = [
      { type: "paragraph", text: '<script>alert("x")</script>' },
      { type: "heading", level: 2, text: "<img onerror=alert(1)>" },
    ];
    const html = renderBlocks(blocks);
    // The words survive as text — that is fine and correct. What must not survive is a
    // real tag: no `<script`, and no `<img` carrying the handler as an attribute.
    assert.equal(/<script/i.test(html), false);
    assert.equal(/<img[^>]*onerror/i.test(html), false);
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(html.includes("&lt;img onerror=alert(1)&gt;"));
  });

  it("neutralises javascript: and data: links", () => {
    const html = renderBlocks([
      { type: "paragraph", text: "[click](javascript:alert(1))" },
      { type: "paragraph", text: "[img](data:text/html;base64,PHNjcmlwdD4=)" },
    ]);
    assert.equal(html.includes("javascript:"), false);
    assert.equal(html.includes("data:text/html"), false);
    assert.ok(html.includes('href="#"'));
  });

  it("renders the inline token syntax", () => {
    const html = renderBlocks([
      { type: "paragraph", text: "**bold** *italic* `code` [link](/spine-surgery/)" },
    ]);
    assert.ok(html.includes("<strong>bold</strong>"));
    assert.ok(html.includes("<em>italic</em>"));
    assert.ok(html.includes("<code>code</code>"));
    assert.ok(html.includes('href="/spine-surgery/"'));
  });

  it("computes read time at 200 words per minute", () => {
    const text = Array.from({ length: 400 }, () => "word").join(" ");
    assert.equal(readTimeFromBlocks([{ type: "paragraph", text }]), 2);
    assert.equal(readTimeFromBlocks([]), 1);
  });
});

describe("editor round trip", () => {
  it("survives blocks → TipTap → blocks unchanged", () => {
    const blocks: Block[] = [
      { type: "heading", level: 2, text: "A **bold** heading" },
      { type: "paragraph", text: "Text with *emphasis*, `code` and a [link](/about/)." },
      { type: "list", ordered: false, items: ["One", "Two **bold**"] },
      { type: "list", ordered: true, items: ["First", "Second"] },
      { type: "quote", text: "Quoted." },
      { type: "code", language: "ts", code: "const x = 1;" },
      { type: "divider" },
      { type: "table", header: ["A", "B"], rows: [["1", "2"]] },
      { type: "image", src: "/x.png", alt: "Alt", caption: "Caption" },
    ];
    assert.deepEqual(tiptapToBlocks(blocksToTiptap(blocks)), blocks);
  });

  it("keeps a literal asterisk literal", () => {
    // The canonical stored form escapes a literal delimiter, so the round trip is
    // stable and the renderer knows it is not emphasis.
    const blocks: Block[] = [{ type: "paragraph", text: "2 \\* 3 = 6" }];
    assert.deepEqual(tiptapToBlocks(blocksToTiptap(blocks)), blocks);
    assert.equal(renderBlocks(blocks), "<p>2 * 3 = 6</p>");
  });

  it("does not read a lone asterisk as emphasis when rendering", () => {
    assert.equal(renderBlocks([{ type: "paragraph", text: "2 * 3 = 6" }]), "<p>2 * 3 = 6</p>");
  });
});

/* ── scheduling maths ───────────────────────────────────────────────────────── */

describe("timezone conversion", () => {
  it("converts an IST wall time to the right UTC instant", () => {
    // Asia/Kolkata is UTC+5:30 year round.
    const utc = wallTimeToUtc("2026-10-03", "14:30", "Asia/Kolkata");
    assert.equal(utc?.toISOString(), "2026-10-03T09:00:00.000Z");
  });

  it("round-trips through the picker's format", () => {
    const utc = wallTimeToUtc("2026-10-03", "14:30", "Asia/Kolkata")!;
    assert.deepEqual(utcToWallTime(utc.toISOString(), "Asia/Kolkata"), {
      date: "2026-10-03",
      time: "14:30",
    });
  });

  it("handles a zone that observes DST on both sides of the transition", () => {
    // New York: EDT (UTC-4) in July, EST (UTC-5) in January.
    assert.equal(
      wallTimeToUtc("2026-07-01", "12:00", "America/New_York")?.toISOString(),
      "2026-07-01T16:00:00.000Z",
    );
    assert.equal(
      wallTimeToUtc("2026-01-01", "12:00", "America/New_York")?.toISOString(),
      "2026-01-01T17:00:00.000Z",
    );
  });

  it("rejects malformed input", () => {
    assert.equal(wallTimeToUtc("", "14:30", "Asia/Kolkata"), null);
    assert.equal(wallTimeToUtc("2026-10-03", "", "Asia/Kolkata"), null);
  });
});

/* ── regressions found during review ────────────────────────────────────────── */

describe("regressions", () => {
  it("does not call a medical acronym shouting", () => {
    // ACDF, TLIF and ALIF are real spine procedures this site writes about; MRI and CT
    // appear constantly. None of them is shouting.
    for (const title of [
      "ACDF Surgery: Recovery, Risks and Treatment Options",
      "MRI and CT for Bulging Disc: What Each Scan Shows",
      "TLIF vs ALIF: Choosing a Spinal Fusion Approach",
    ]) {
      const rule = scoreSeoTitle(title, ctx).rules.find((r) => r.id === "title-clean")!;
      assert.equal(rule.passed, true, `"${title}" was flagged: ${rule.problem}`);
    }
  });

  it("still catches actual shouting", () => {
    for (const title of [
      "Bulging Disc: URGENT Signs You Should Not Ignore",
      "Bulging Disc: MUST READ Before Your Consultation",
    ]) {
      const rule = scoreSeoTitle(title, ctx).rules.find((r) => r.id === "title-clean")!;
      assert.equal(rule.passed, false, `"${title}" was not flagged`);
    }
  });
});
