import fs from "node:fs";
import path from "node:path";
import { load as parseYaml } from "js-yaml";
import { marked } from "marked";
import { OG_IMAGE } from "@/lib/seo";
import type { Metadata } from "next";

/**
 * Loader for the migrated WordPress content in `content/`.
 *
 * Every file is plain Markdown with a YAML frontmatter block produced by the Phase 2
 * extraction (see _migration/EXTRACTION-REPORT.md). Bodies contain no JSX, so they are
 * compiled to HTML at build time rather than evaluated as MDX — content stays inert data.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface FeaturedImage {
  src: string;
  alt: string;
  title: string;
}

export interface ContentDoc {
  title: string;
  /** Original WordPress path, trailing slash included — e.g. "/bulging-disc-vs-herniated-disc/" */
  slug: string;
  date: string | null;
  modified: string | null;
  postType: "post" | "page" | "post_tag";
  categories: string[];
  tags: string[];
  author: string | null;
  excerpt: string;
  featuredImage: FeaturedImage | null;
  noindex?: boolean;
  contentSource: "xml" | "rawHtml" | "none";
  /** Verbatim from the crawl. Never regenerate these. */
  seo: Record<string, string>;
  /** JSON-LD strings captured byte-for-byte from the live site. */
  schema: string[];
  /** Raw Markdown body. */
  body: string;
  /** Next.js route path, no trailing slash — "" for the home page. */
  route: string;
  /** Path relative to content/, without extension — "about" or "tag/paralysis". */
  fileSlug: string;
}

/**
 * Slugs that are served by their own hand-built route rather than by `app/[slug]`.
 * These keep the template's design; only their metadata and JSON-LD come from `content/`.
 */
export const STATIC_ROUTE_SLUGS: ReadonlySet<string> = new Set([
  "index",
  "about",
  "blog",
  "brain-surgery",
  "spine-surgery",
  "news-awards",
]);

function readAll(): ContentDoc[] {
  const docs: ContentDoc[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith(".md")) continue;

      // Normalised to LF before parsing. The repo stores these files with LF, but a Windows
      // checkout under core.autocrlf=true rewrites them to CRLF — which the frontmatter
      // regex below would not match, silently dropping every document.
      const raw = fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n");
      const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
      if (!match) continue;

      const fm = parseYaml(match[1]) as Omit<ContentDoc, "body" | "route" | "fileSlug">;
      const fileSlug = path
        .relative(CONTENT_DIR, full)
        .replace(/\\/g, "/")
        .replace(/\.md$/, "");

      docs.push({
        ...fm,
        // Display strings get WordPress's wptexturize treatment so headings and excerpts
        // match what was rendered — and indexed — on the live site. `seo` and `schema` are
        // deliberately NOT texturized: they must stay byte-identical to the capture.
        title: texturize(fm.title ?? ""),
        excerpt: texturize(fm.excerpt ?? ""),
        body: raw.slice(match[0].length),
        fileSlug,
        route: fileSlug === "index" ? "" : `/${fileSlug}`,
      });
    }
  };
  walk(CONTENT_DIR);
  return docs;
}

let cache: ContentDoc[] | null = null;

/** All migrated documents. Read once per process. */
export function getAllDocs(): ContentDoc[] {
  if (!cache) cache = readAll();
  return cache;
}

export function getDocByFileSlug(fileSlug: string): ContentDoc | undefined {
  return getAllDocs().find((d) => d.fileSlug === fileSlug);
}

/** Blog posts, newest first. */
export function getPosts(): ContentDoc[] {
  return getAllDocs()
    .filter((d) => d.postType === "post")
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function getTagDocs(): ContentDoc[] {
  return getAllDocs()
    .filter((d) => d.postType === "post_tag")
    .sort((a, b) => a.fileSlug.localeCompare(b.fileSlug));
}

/** Posts carrying a given tag slug, newest first. */
export function getPostsByTag(tag: string): ContentDoc[] {
  return getPosts().filter((p) => p.tags.includes(tag));
}

/**
 * Single-segment slugs served by `app/[slug]`: every migrated post plus the migrated
 * pages that have no hand-built route of their own.
 */
export function getDynamicRootDocs(): ContentDoc[] {
  return getAllDocs().filter(
    (d) =>
      d.postType !== "post_tag" &&
      !d.fileSlug.includes("/") &&
      !STATIC_ROUTE_SLUGS.has(d.fileSlug)
  );
}

marked.setOptions({ gfm: true, breaks: false });

/**
 * Drop a leading level-1 heading from a body.
 *
 * Every body-rendered route already emits the page <h1> itself — <PageHero> for migrated
 * pages, the article header for posts. Elementor pages whose first block was a heading
 * therefore produced a duplicate <h1> (an accessibility and SEO defect). Strip it.
 */
export function stripLeadingH1(body: string): string {
  return body.replace(/^\s*#\s+[^\n]*(?:\r?\n)+/, "");
}

/**
 * A focused port of WordPress's `wptexturize()`.
 *
 * WordPress applied this to titles and post content at render time, so the live site showed
 * curly quotes, dashes and ellipses while the WXR export stores the raw typed characters.
 * Running it at build time keeps the new site character-identical to what was indexed, and
 * makes future content behave the same way.
 *
 * Handles: apostrophes, single/double quotes, `--`/`---`, `...`.
 * Deliberately omits WordPress's `(c)`/`(tm)`/`x` multiplication rules — they misfire more
 * often than they help.
 */
export function texturize(text: string): string {
  return text
    .replace(/\.\.\./g, "\u2026")
    .replace(/(^|[^-])---([^-]|$)/g, "$1\u2014$2")
    .replace(/(^|\s)--(\s|$)/g, "$1\u2013$2")
    // apostrophe inside a word, or before a decade ('90s)
    .replace(/(\w)'(\w)/g, "$1\u2019$2")
    .replace(/'(\d\d(?:s)?\b)/g, "\u2019$1")
    // double quotes: opening after start/space/open-bracket, closing otherwise
    .replace(/(^|[\s([{<])"/g, "$1\u201c")
    .replace(/"/g, "\u201d")
    // remaining single quotes
    .replace(/(^|[\s([{<])'/g, "$1\u2018")
    .replace(/'/g, "\u2019");
}

const SKIP_TEXTURIZE = /^(code|pre|script|style|kbd|samp|var)$/i;

/**
 * Apply `texturize` to the text nodes of an HTML string, never to tags, attributes, or the
 * contents of code-ish elements.
 */
export function texturizeHtml(html: string): string {
  let out = "";
  let i = 0;
  let skipDepth = 0;
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html))) {
    const text = html.slice(i, m.index);
    out += skipDepth > 0 ? text : texturize(text);
    out += m[0];
    i = m.index + m[0].length;
    if (SKIP_TEXTURIZE.test(m[1])) {
      if (m[0].startsWith("</")) skipDepth = Math.max(0, skipDepth - 1);
      else if (!m[0].endsWith("/>")) skipDepth++;
    }
  }
  const tail = html.slice(i);
  out += skipDepth > 0 ? tail : texturize(tail);
  return out;
}

/* ── image quality ──────────────────────────────────────────────────────────
 * WordPress often wrote a generated crop (`-300x200`) into the markup while the
 * full-size original sat unused in the same folder. See _migration/IMAGE-QUALITY.md.
 *
 * `upgradeImages` swaps each <img src> to the largest variant on disk and pins
 * width/height to the ORIGINAL referenced dimensions, so the rendered box is unchanged
 * and only the pixel density improves.
 */

const THUMB_RE = /^(.*)-(\d{2,4})x(\d{2,4})(\.[a-zA-Z0-9]+)$/;

function intrinsicSize(abs: string): { w: number; h: number } | null {
  let fd: number;
  try { fd = fs.openSync(abs, "r"); } catch { return null; }
  const buf = Buffer.alloc(65536);
  const n = fs.readSync(fd, buf, 0, 65536, 0);
  fs.closeSync(fd);
  const b = buf.subarray(0, n);
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.subarray(0, 3).toString("latin1") === "GIF") return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  if (b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") {
    const fmt = b.subarray(12, 16).toString("latin1");
    if (fmt === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (fmt === "VP8L") { const bits = b.readUInt32LE(21); return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 }; }
    if (fmt === "VP8X") return { w: (b.readUIntLE(24, 3) & 0xffffff) + 1, h: (b.readUIntLE(27, 3) & 0xffffff) + 1 };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

const bestCache = new Map<string, { src: string; w: number; h: number } | null>();

/** Largest on-disk variant of a `/wp-content/uploads/...` path, or null if it is already it. */
export function bestVariant(src: string): { src: string; w: number; h: number } | null {
  if (bestCache.has(src)) return bestCache.get(src)!;
  const result = (() => {
    if (!src.startsWith("/wp-content/uploads/")) return null;
    const rel = decodeURIComponent(src.split("?")[0]);
    const dir = path.posix.dirname(rel);
    const absDir = path.join(process.cwd(), "public", dir);
    if (!fs.existsSync(absDir)) return null;
    const base = path.posix.basename(rel);
    const m = THUMB_RE.exec(base);
    const stem = m ? m[1] : base.replace(/\.[a-zA-Z0-9]+$/, "");
    const ext = m ? m[4] : path.posix.extname(base);
    let best: { src: string; w: number; h: number } | null = null;
    for (const f of fs.readdirSync(absDir)) {
      if (!f.startsWith(stem) || !f.endsWith(ext)) continue;
      const rest = f.slice(stem.length);
      if (rest !== ext && !new RegExp(`^-\\d{2,4}x\\d{2,4}\\${ext}$`).test(rest)) continue;
      const d = intrinsicSize(path.join(absDir, f));
      if (d && (!best || d.w > best.w)) best = { src: path.posix.join(dir, f), w: d.w, h: d.h };
    }
    return best;
  })();
  bestCache.set(src, result);
  return result;
}

/**
 * Rewrite <img> tags in rendered HTML to the sharpest available file, at unchanged
 * rendered dimensions. Also adds lazy loading — body images are all below the fold.
 */
export function upgradeImages(html: string): string {
  return html.replace(/<img\s+([^>]*?)src="([^"]+)"([^>]*?)>/g, (whole, pre: string, src: string, post: string) => {
    if (!src.startsWith("/wp-content/uploads/")) return whole;
    const current = intrinsicSize(path.join(process.cwd(), "public", decodeURIComponent(src)));
    const best = bestVariant(src);
    const shown = current ?? (best ? { w: best.w, h: best.h } : null);
    const nextSrc = best && current && best.w > current.w ? best.src : src;
    const dims = shown ? ` width="${shown.w}" height="${shown.h}"` : "";
    return `<img ${pre}src="${nextSrc}"${post}${dims} loading="lazy" decoding="async">`;
  });
}

/** Compile a document body to HTML at build time. */
export function renderMarkdown(body: string): string {
  return upgradeImages(texturizeHtml(marked.parse(body, { async: false }) as string));
}

/**
 * Build Next metadata from the STORED seo block only.
 *
 * Nothing here is invented or supplemented — every value comes from the crawl capture in
 * frontmatter. `title.absolute` bypasses the root layout's title template so the stored
 * title is emitted exactly as WordPress had it.
 */
export function metadataFromDoc(doc: ContentDoc): Metadata {
  const seo = doc.seo ?? {};
  const meta: Metadata = {};

  if (seo.title) meta.title = { absolute: seo.title };
  if (seo.canonical) meta.alternates = { canonical: seo.canonical };

  meta.robots = doc.noindex ? { index: false, follow: true } : seo.robots || undefined;

  // `null`, not `undefined` — Next treats undefined as "inherit from the layout", which would
  // silently reintroduce the root layout's defaults on pages where WordPress emitted nothing.
  // The 19 archive URLs are the clearest case: they had no description and no og:/twitter: tags
  // at all. `keywords` and `authors` are always suppressed because the captured seo block does
  // not contain them, so there is no stored value to emit.
  meta.description = seo.description || null;
  meta.keywords = null;
  meta.authors = null;

  // Built as whole literals so TypeScript can discriminate the og:type / twitter:card
  // unions. Only TEXT keys present in the capture are emitted — no title, description,
  // url, site_name or locale is invented.
  //
  // `images` is the one addition to the capture. WordPress emitted no og:image on any of
  // the 203 URLs, so a shared link showed no preview card anywhere; unlike the text keys
  // there is no indexed value being overwritten, and og:image is not indexed copy. It is
  // attached to indexable documents only — a noindex archive has no reason to carry one.
  const ogKeys = ["og:title", "og:description", "og:url", "og:site_name", "og:locale"];
  if (ogKeys.some((k) => seo[k]) || seo["og:type"]) {
    const common = {
      ...(seo["og:title"] ? { title: seo["og:title"] } : {}),
      ...(seo["og:description"] ? { description: seo["og:description"] } : {}),
      ...(seo["og:url"] ? { url: seo["og:url"] } : {}),
      ...(seo["og:site_name"] ? { siteName: seo["og:site_name"] } : {}),
      ...(seo["og:locale"] ? { locale: seo["og:locale"] } : {}),
      ...(doc.noindex ? {} : { images: [OG_IMAGE] }),
    };
    meta.openGraph = seo["og:type"] === "article" ? { ...common, type: "article" } : { ...common };
  } else {
    meta.openGraph = null;
  }

  const twText = {
    ...(seo["twitter:title"] ? { title: seo["twitter:title"] } : {}),
    ...(seo["twitter:description"] ? { description: seo["twitter:description"] } : {}),
    ...(doc.noindex ? {} : { images: [OG_IMAGE.url] }),
  };
  if (seo["twitter:card"] === "summary_large_image" || seo["twitter:card"] === "summary") {
    meta.twitter = { card: seo["twitter:card"], ...twText };
  } else if (Object.keys(twText).length) {
    meta.twitter = twText;
  } else {
    meta.twitter = null;
  }

  return meta;
}

/** Shape consumed by the blog listing components. */
export interface PostSummary {
  slug: string;
  title: string;
  /** Absent for migrated posts — WordPress only ever used one category, "uncategorized". */
  category?: string;
  excerpt: string;
  readingTime: string;
  date: string;
  image: string;
  featured?: boolean;
}

/** Reading time derived from body length (200 wpm) — WordPress stored none. */
function readingTime(body: string): string {
  const words = body.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export function toPostSummary(doc: ContentDoc): PostSummary {
  return {
    slug: doc.fileSlug,
    title: doc.title,
    excerpt: doc.excerpt,
    readingTime: readingTime(doc.body),
    date: doc.date ?? "",
    image: doc.featuredImage?.src ?? "",
    };
}

/** Post summaries, newest first. The newest is flagged `featured` for the listing hero. */
export function getPostSummaries(): PostSummary[] {
  return getPosts().map((d, i) => ({ ...toPostSummary(d), featured: i === 0 }));
}
