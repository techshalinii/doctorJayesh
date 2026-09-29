import fs from "node:fs";
import path from "node:path";
import { load as parseYaml } from "js-yaml";
import { marked } from "marked";
import { OG_IMAGE } from "@/lib/seo";
import type { Metadata } from "next";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface FeaturedImage {
  src: string;
  alt: string;
  title: string;
}

export interface ContentDoc {
  title: string;
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
  seo: Record<string, string>;
  schema: string[];
  body: string;
  route: string;
  fileSlug: string;
}

export const STATIC_ROUTE_SLUGS: ReadonlySet<string> = new Set([
  "index",
  "about",
  "blog",
  "brain-surgery",
  "spine-surgery",
  "news-awards",
  "fellowship",
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

export function getAllDocs(): ContentDoc[] {
  if (!cache) cache = readAll();
  return cache;
}

export function getDocByFileSlug(fileSlug: string): ContentDoc | undefined {
  return getAllDocs().find((d) => d.fileSlug === fileSlug);
}

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

export function getPostsByTag(tag: string): ContentDoc[] {
  return getPosts().filter((p) => p.tags.includes(tag));
}

export function getDynamicRootDocs(): ContentDoc[] {
  return getAllDocs().filter(
    (d) =>
      d.postType !== "post_tag" &&
      !d.fileSlug.includes("/") &&
      !STATIC_ROUTE_SLUGS.has(d.fileSlug)
  );
}

marked.setOptions({ gfm: true, breaks: false });

export function stripLeadingH1(body: string): string {
  return body.replace(/^\s*#\s+[^\n]*(?:\r?\n)+/, "");
}

export function texturize(text: string): string {
  return text
    .replace(/\.\.\./g, "\u2026")
    .replace(/(^|[^-])---([^-]|$)/g, "$1\u2014$2")
    .replace(/(^|\s)--(\s|$)/g, "$1\u2013$2")
    .replace(/(\w)'(\w)/g, "$1\u2019$2")
    .replace(/'(\d\d(?:s)?\b)/g, "\u2019$1")
    .replace(/(^|[\s([{<])"/g, "$1\u201c")
    .replace(/"/g, "\u201d")
    .replace(/(^|[\s([{<])'/g, "$1\u2018")
    .replace(/'/g, "\u2019");
}

const SKIP_TEXTURIZE = /^(code|pre|script|style|kbd|samp|var)$/i;

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

export function renderMarkdown(body: string): string {
  return upgradeImages(texturizeHtml(marked.parse(body, { async: false }) as string));
}

export function metadataFromDoc(doc: ContentDoc): Metadata {
  const seo = doc.seo ?? {};
  const meta: Metadata = {};

  if (seo.title) meta.title = { absolute: seo.title };
  if (seo.canonical) meta.alternates = { canonical: seo.canonical };

  meta.robots = doc.noindex ? { index: false, follow: true } : seo.robots || undefined;

  meta.description = seo.description || null;
  meta.keywords = null;
  meta.authors = null;

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

export interface PostSummary {
  slug: string;
  title: string;
  category?: string;
  excerpt: string;
  readingTime: string;
  date: string;
  image: string;
  featured?: boolean;
}

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

export function getPostSummaries(): PostSummary[] {
  return getPosts().map((d, i) => ({ ...toPostSummary(d), featured: i === 0 }));
}
