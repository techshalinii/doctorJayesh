const TYPED_BULLET = String.raw`(?:[•●◦▪·]|&bull;|&#8226;|&#x2022;|&middot;)`;
const LEADING_BULLET = new RegExp(
  String.raw`(<li\b[^>]*>(?:\s|<p\b[^>]*>|<strong\b[^>]*>|<b\b[^>]*>|<em\b[^>]*>)*)` + TYPED_BULLET + String.raw`(?:\s|&nbsp;)*`,
  "gi",
);

/**
 * Removes a bullet character typed at the start of a list item ("• text"). Migrated
 * WordPress posts often have one, and with the list's own marker it shows two bullets.
 */
export function stripTypedBullets(html: string): string {
  return html.replace(LEADING_BULLET, "$1");
}

const LEADING_CHECK = /<li\b([^>]*)>((?:\s|<p\b[^>]*>|<strong\b[^>]*>|<b\b[^>]*>|<em\b[^>]*>)*)(?=[✓✔☑])/gi;

/**
 * Marks list items whose text starts with a check mark ("✓ text") so the stylesheet can
 * hide the list's own bullet for them — the check mark then serves as the marker.
 */
export function markCheckItems(html: string): string {
  return html.replace(LEADING_CHECK, (_match, attrs: string, lead: string) => {
    const withClass = /\sclass=["']/i.test(attrs)
      ? attrs.replace(/\sclass=(["'])/i, " class=$1check-item ")
      : `${attrs} class="check-item"`;
    return `<li${withClass}>${lead}`;
  });
}

export interface ArticleHeading {
  id: string;
  text: string;
}

const strip = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&#x27;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "section";

/**
 * Gives every section heading an id and returns the list for an "On this page" menu.
 * Uses the highest heading level (h2–h4) that has at least two headings — many migrated
 * posts have a single h2 (the title repeated) with their real sections in h3.
 */
export function withHeadingIds(html: string): { html: string; headings: ArticleHeading[] } {
  const count = (l: number) => (html.match(new RegExp(`<h${l}[\\s>]`, "gi")) ?? []).length;
  const levels = [2, 3, 4];
  const level = levels.find((l) => count(l) >= 2) ?? levels.find((l) => count(l) >= 1) ?? 0;
  if (!level) return { html, headings: [] };

  const used = new Set<string>();
  const headings: ArticleHeading[] = [];
  const pattern = new RegExp(`<h${level}(\\s[^>]*)?>([\\s\\S]*?)<\\/h${level}>`, "gi");

  const out = html.replace(pattern, (match, attrs: string | undefined, inner: string) => {
    const text = strip(inner);
    if (!text) return match;

    const existing = attrs?.match(/\sid=["']([^"']+)["']/i)?.[1];
    let id = existing ?? slugify(text);
    if (!existing) {
      let n = 2;
      while (used.has(id)) id = `${slugify(text)}-${n++}`;
    }
    used.add(id);
    headings.push({ id, text });

    return existing ? match : `<h${level} id="${id}"${attrs ?? ""}>${inner}</h${level}>`;
  });

  return { html: out, headings };
}
