/**
 * Shapes shared by the CMS reader, the admin editor and the public renderer.
 *
 * `BlogRow` mirrors `public.blogs` in supabase/migrations/0001_blog_cms.sql
 * column for column. Keep the two in step.
 */

export const BLOG_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

/** One question/answer pair. Rendered as FAQPage JSON-LD on the public page. */
export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Structured content blocks.
 *
 * Bodies are stored as this union, never as raw HTML: the editor round-trips it,
 * the public renderer escapes every value it interpolates, and a stored document
 * can therefore never inject markup into the page.
 *
 * Inline emphasis inside `text` uses a tiny token syntax — `**bold**`, `*italic*`,
 * `` `code` `` and `[label](url)` — parsed by lib/cms/blocks.ts.
 */
export type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; language?: string; code: string }
  | { type: "divider" }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "image"; src: string; alt: string; caption?: string };

export interface BlogRow {
  id: string;
  title: string;
  slug: string;
  /** Slugs this post previously lived at; each 308s to `slug`. */
  previous_slugs: string[];
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
  og_image: string | null;
  twitter_image: string | null;
  read_time: number;
  author: string;
  status: BlogStatus;
  /** Author-set publish date — drives visibility, display and ordering. */
  publish_at: string | null;
  /** Internal first-went-live stamp. Never used for visibility. */
  published_at: string | null;
  time_zone: string;
  related_blogs: string[];
  faq: FaqItem[];
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  /** Denormalised creator email, for the admin list's "Created By" column. */
  created_by_email: string;
}

/** A new, unsaved post. */
export type BlogDraft = Omit<
  BlogRow,
  "id" | "created_at" | "updated_at" | "created_by" | "updated_by" | "version"
>;

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Editorial display order; lower comes first. New categories default to 1000. */
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MediaRow {
  id: string;
  path: string;
  url: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  created_at: string;
  created_by: string | null;
}

export interface BlogVersionRow {
  id: string;
  blog_id: string;
  version: number;
  snapshot: Partial<BlogRow>;
  note: string;
  created_at: string;
  created_by: string | null;
}
