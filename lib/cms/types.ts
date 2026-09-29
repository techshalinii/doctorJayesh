export const BLOG_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export interface FaqItem {
  question: string;
  answer: string;
}

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
  publish_at: string | null;
  published_at: string | null;
  time_zone: string;
  related_blogs: string[];
  faq: FaqItem[];
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_email: string;
}

export type BlogDraft = Omit<
  BlogRow,
  "id" | "created_at" | "updated_at" | "created_by" | "updated_by" | "version"
>;

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string;
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
