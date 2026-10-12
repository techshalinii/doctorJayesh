export const BLOG_CATEGORIES = [
  "Brain",
  "Spine",
  "Stroke",
  "Paralysis",
  "Tumour",
  "Migraine",
  "Back",
  "Neck",
  "Disc",
  "Surgery",
  "Children",
  "Rehab",
  "Nutrition",
  "Sleep",
  "Parkinson",
  "Memory",
  "Epilepsy",
  "Arthritis",
  "Genetic",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

const BY_LOWER = new Map(BLOG_CATEGORIES.map((c) => [c.toLowerCase(), c]));

export function toBlogCategory(value: string | null | undefined): BlogCategory | undefined {
  return value ? BY_LOWER.get(value.trim().toLowerCase()) : undefined;
}
