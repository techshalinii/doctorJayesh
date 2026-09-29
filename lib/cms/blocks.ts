import type { Block } from "@/lib/cms/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(raw: string): string {
  const url = raw.trim();
  if (/^\/(?!\/)/.test(url) || url.startsWith("#")) return url;
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  return "#";
}

const INLINE_TOKEN =
  /(\\[\\*`[\]])|(\[(?:[^\]\\]|\\.)*\]\([^)\s]*\))|(\*\*(?:[^*\\]|\\.)+?\*\*)|(\*(?:[^*\\]|\\.)+?\*)|(`(?:[^`\\]|\\.)+?`)/g;

const unescapeTokens = (text: string) => text.replace(/\\([\\*`[\]])/g, "$1");

export function renderInline(text: string): string {
  let html = "";
  let last = 0;

  for (const match of text.matchAll(INLINE_TOKEN)) {
    const index = match.index ?? 0;
    html += escapeHtml(unescapeTokens(text.slice(last, index)));
    last = index + match[0].length;

    const [, escaped, link, bold, italic, code] = match;

    if (escaped) {
      html += escapeHtml(escaped.slice(1));
    } else if (link) {
      const parsed = /^\[((?:[^\]\\]|\\.)*)\]\(([^)\s]*)\)$/.exec(link);
      if (!parsed) {
        html += escapeHtml(unescapeTokens(link));
        continue;
      }
      const url = safeUrl(unescapeTokens(parsed[2]));
      const external = /^https?:/i.test(url) && !url.includes("drjayeshsardhara.com");
      const rel = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      html += `<a href="${escapeHtml(url)}"${rel}>${renderInline(parsed[1])}</a>`;
    } else if (bold) {
      html += `<strong>${renderInline(bold.slice(2, -2))}</strong>`;
    } else if (italic) {
      html += `<em>${renderInline(italic.slice(1, -1))}</em>`;
    } else if (code) {
      html += `<code>${escapeHtml(unescapeTokens(code.slice(1, -1)))}</code>`;
    }
  }

  return html + escapeHtml(unescapeTokens(text.slice(last)));
}

export function renderBlocks(blocks: Block[]): string {
  return blocks.map(renderBlock).join("\n");
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case "heading": {
      const tag = `h${block.level}`;
      return `<${tag} id="${slugifyHeading(block.text)}">${renderInline(block.text)}</${tag}>`;
    }
    case "paragraph":
      return block.text.trim() ? `<p>${renderInline(block.text)}</p>` : "";
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items.map((i) => `<li>${renderInline(i)}</li>`).join("");
      return `<${tag}>${items}</${tag}>`;
    }
    case "quote":
      return `<blockquote><p>${renderInline(block.text)}</p></blockquote>`;
    case "code":
      return `<pre><code${
        block.language ? ` class="language-${escapeHtml(block.language)}"` : ""
      }>${escapeHtml(block.code)}</code></pre>`;
    case "divider":
      return "<hr />";
    case "table": {
      const head = block.header.length
        ? `<thead><tr>${block.header.map((c) => `<th>${renderInline(c)}</th>`).join("")}</tr></thead>`
        : "";
      const body = block.rows
        .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`)
        .join("");
      return `<div class="table-scroll"><table>${head}<tbody>${body}</tbody></table></div>`;
    }
    case "image": {
      const img = `<img src="${escapeHtml(safeUrl(block.src))}" alt="${escapeHtml(
        block.alt,
      )}" loading="lazy" decoding="async" />`;
      return block.caption
        ? `<figure>${img}<figcaption>${renderInline(block.caption)}</figcaption></figure>`
        : `<figure>${img}</figure>`;
    }
  }
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export function blocksToPlainText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "heading":
      case "paragraph":
      case "quote":
        parts.push(b.text);
        break;
      case "list":
        parts.push(b.items.join(" "));
        break;
      case "table":
        parts.push(b.header.join(" "), ...b.rows.map((r) => r.join(" ")));
        break;
      case "image":
        if (b.caption) parts.push(b.caption);
        break;
      case "code":
      case "divider":
        break;
    }
  }
  return parts
    .join(" ")
    .replace(/[*`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function readTimeFromBlocks(blocks: Block[]): number {
  const words = blocksToPlainText(blocks).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function parseBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) return [];
  const out: Block[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const b = raw as Record<string, unknown>;
    const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
    const strArray = (k: string) =>
      Array.isArray(b[k]) ? (b[k] as unknown[]).filter((x): x is string => typeof x === "string") : [];

    switch (b.type) {
      case "heading": {
        const level = b.level === 1 || b.level === 3 ? b.level : 2;
        out.push({ type: "heading", level, text: str("text") });
        break;
      }
      case "paragraph":
        out.push({ type: "paragraph", text: str("text") });
        break;
      case "list":
        out.push({ type: "list", ordered: b.ordered === true, items: strArray("items") });
        break;
      case "quote":
        out.push({ type: "quote", text: str("text") });
        break;
      case "code":
        out.push({ type: "code", code: str("code"), ...(str("language") ? { language: str("language") } : {}) });
        break;
      case "divider":
        out.push({ type: "divider" });
        break;
      case "table":
        out.push({
          type: "table",
          header: strArray("header"),
          rows: Array.isArray(b.rows)
            ? (b.rows as unknown[]).map((r) =>
                Array.isArray(r) ? r.filter((c): c is string => typeof c === "string") : [],
              )
            : [],
        });
        break;
      case "image":
        out.push({
          type: "image",
          src: str("src"),
          alt: str("alt"),
          ...(str("caption") ? { caption: str("caption") } : {}),
        });
        break;
    }
  }
  return out;
}
