import "server-only";

import { getPosts } from "@/lib/content";
import { blocksToPlainText } from "@/lib/cms/blocks";
import type { BlogRow } from "@/lib/cms/types";
import { EXTRACT_CHARS, wordCount } from "@/lib/cms/corpus";
import type { CorpusItem } from "@/lib/ai/types";

function plainFromMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function markdownCorpus(): CorpusItem[] {
  return getPosts().map((doc) => {
    const plain = plainFromMarkdown(doc.body);
    return {
      source: "markdown",
      title: doc.title,
      slug: doc.slug.replace(/^\/|\/$/g, "") || doc.fileSlug,
      body: plain.slice(0, EXTRACT_CHARS),
      excerpt: doc.excerpt,
      categories: doc.categories,
      tags: doc.tags,
      focusKeyword: doc.seo["focus_keyword"] ?? "",
      seoTitle: doc.seo["title"] ?? doc.title,
      metaDescription: doc.seo["description"] ?? doc.excerpt,
      wordCount: wordCount(plain),
      hasFaq: /^##\s*FAQ/im.test(doc.body),
      imageAlt: doc.featuredImage?.alt ?? "",
      publishedAt: doc.date,
    };
  });
}

export function supabaseCorpus(rows: BlogRow[]): CorpusItem[] {
  return rows
    .filter((row) => row.status !== "archived")
    .map((row) => {
      const plain = blocksToPlainText(row.content ?? []);
      return {
        source: "supabase" as const,
        title: row.title,
        slug: row.slug,
        body: plain.slice(0, EXTRACT_CHARS),
        excerpt: row.excerpt,
        categories: row.category ? [row.category] : [],
        tags: row.tags ?? [],
        focusKeyword: row.focus_keyword ?? "",
        seoTitle: row.seo_title || row.title,
        metaDescription: row.meta_description ?? "",
        wordCount: wordCount(plain),
        hasFaq: (row.faq ?? []).length > 0,
        imageAlt: row.image_alt ?? "",
        publishedAt: row.publish_at,
      };
    });
}

export function fullCorpus(rows: BlogRow[]): CorpusItem[] {
  return [...markdownCorpus(), ...supabaseCorpus(rows)];
}

export * from "@/lib/cms/corpus";
