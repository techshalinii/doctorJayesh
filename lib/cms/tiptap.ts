import type { Block } from "@/lib/cms/types";

/**
 * TipTap document ↔ stored blocks.
 *
 * The editor works in ProseMirror's node tree; the database stores the flat block union
 * from lib/cms/types.ts. Converting at the boundary — rather than storing ProseMirror
 * JSON directly — means the public renderer never has to understand an editor's
 * internal format, and swapping the editor later would not require a data migration.
 *
 * Inline marks round-trip through the token syntax the renderer already understands:
 * `**bold**`, `*italic*`, `` `code` `` and `[label](url)`.
 */

/* ── ProseMirror shapes, narrowed to what this editor produces ──────────────── */

interface PmMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface PmNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PmNode[];
  text?: string;
  marks?: PmMark[];
}

const attrString = (node: PmNode, key: string): string =>
  typeof node.attrs?.[key] === "string" ? (node.attrs[key] as string) : "";

/* ── TipTap → blocks ────────────────────────────────────────────────────────── */

/**
 * Escape the characters the token syntax uses, so a literal asterisk typed by the
 * author survives the round trip instead of turning into emphasis on the way out.
 */
function escapeTokens(text: string): string {
  // The backslash itself is escaped too, or `C:\*` would round-trip into an escape it
  // never was. The grammar in lib/cms/blocks.ts reads exactly this set back.
  return text.replace(/([\\*`[\]])/g, "\\$1");
}

/** Inline content → a token string. Marks are applied innermost-first. */
function inlineToText(nodes: PmNode[] | undefined): string {
  if (!nodes) return "";
  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return " ";
      if (node.type !== "text" || !node.text) return "";

      let text = escapeTokens(node.text);
      const marks = node.marks ?? [];

      if (marks.some((m) => m.type === "code")) text = `\`${text}\``;
      if (marks.some((m) => m.type === "bold")) text = `**${text}**`;
      if (marks.some((m) => m.type === "italic")) text = `*${text}*`;

      const link = marks.find((m) => m.type === "link");
      if (link && typeof link.attrs?.href === "string") text = `[${text}](${link.attrs.href})`;

      return text;
    })
    .join("");
}

/** Every paragraph inside a list item, flattened — nested lists are not supported. */
function listItemToText(item: PmNode): string {
  return (item.content ?? [])
    .map((child) => inlineToText(child.content))
    .filter(Boolean)
    .join(" ");
}

function cellToText(cell: PmNode): string {
  return (cell.content ?? [])
    .map((child) => inlineToText(child.content))
    .filter(Boolean)
    .join(" ");
}

export function tiptapToBlocks(doc: PmNode | null | undefined): Block[] {
  if (!doc?.content) return [];
  const blocks: Block[] = [];

  for (const node of doc.content) {
    switch (node.type) {
      case "heading": {
        const raw = Number(node.attrs?.level ?? 2);
        const level = (raw === 1 ? 1 : raw >= 3 ? 3 : 2) as 1 | 2 | 3;
        const text = inlineToText(node.content);
        if (text.trim()) blocks.push({ type: "heading", level, text });
        break;
      }
      case "paragraph": {
        const text = inlineToText(node.content);
        // An empty paragraph is ProseMirror's cursor spacing, not content.
        if (text.trim()) blocks.push({ type: "paragraph", text });
        break;
      }
      case "bulletList":
      case "orderedList": {
        const items = (node.content ?? []).map(listItemToText).filter(Boolean);
        if (items.length) blocks.push({ type: "list", ordered: node.type === "orderedList", items });
        break;
      }
      case "blockquote": {
        const text = (node.content ?? [])
          .map((child) => inlineToText(child.content))
          .filter(Boolean)
          .join(" ");
        if (text.trim()) blocks.push({ type: "quote", text });
        break;
      }
      case "codeBlock": {
        const code = (node.content ?? []).map((c) => c.text ?? "").join("");
        const language = attrString(node, "language");
        blocks.push({ type: "code", code, ...(language ? { language } : {}) });
        break;
      }
      case "horizontalRule":
        blocks.push({ type: "divider" });
        break;
      case "image": {
        const src = attrString(node, "src");
        if (src) {
          const caption = attrString(node, "title");
          blocks.push({
            type: "image",
            src,
            alt: attrString(node, "alt"),
            ...(caption ? { caption } : {}),
          });
        }
        break;
      }
      case "table": {
        const rows = node.content ?? [];
        // A first row of header cells becomes the <thead>; otherwise the table has none.
        const firstIsHeader = (rows[0]?.content ?? []).every((c) => c.type === "tableHeader");
        const header = firstIsHeader ? (rows[0].content ?? []).map(cellToText) : [];
        const body = (firstIsHeader ? rows.slice(1) : rows).map((row) =>
          (row.content ?? []).map(cellToText),
        );
        blocks.push({ type: "table", header, rows: body });
        break;
      }
    }
  }
  return blocks;
}

/* ── blocks → TipTap ────────────────────────────────────────────────────────── */

/** Must stay identical to `INLINE_TOKEN` in lib/cms/blocks.ts — same grammar, two readers. */
const TOKEN =
  /(\\[\\*`[\]])|(\[(?:[^\]\\]|\\.)*\]\([^)\s]*\))|(\*\*(?:[^*\\]|\\.)+?\*\*)|(\*(?:[^*\\]|\\.)+?\*)|(`(?:[^`\\]|\\.)+?`)/g;

const unescape = (text: string) => text.replace(/\\([\\*`[\]])/g, "$1");

/** Token string → ProseMirror inline nodes. The inverse of `inlineToText`. */
function textToInline(text: string): PmNode[] {
  const nodes: PmNode[] = [];
  let last = 0;

  const push = (value: string, marks?: PmMark[]) => {
    if (!value) return;
    nodes.push({ type: "text", text: value, ...(marks?.length ? { marks } : {}) });
  };

  for (const match of text.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    push(unescape(text.slice(last, index)));
    last = index + match[0].length;

    const [, escaped, link, bold, italic, code] = match;

    if (escaped) {
      push(escaped.slice(1));
    } else if (link) {
      const parsed = /^\[((?:[^\]\\]|\\.)*)\]\(([^)\s]*)\)$/.exec(link);
      if (parsed) {
        // A link label may itself carry emphasis, so it recurses and the href mark is
        // added to whatever marks the label produced.
        for (const child of textToInline(parsed[1])) {
          child.marks = [...(child.marks ?? []), { type: "link", attrs: { href: parsed[2] } }];
          nodes.push(child);
        }
      } else {
        push(unescape(link));
      }
    } else if (bold) {
      push(unescape(bold.slice(2, -2)), [{ type: "bold" }]);
    } else if (italic) {
      push(unescape(italic.slice(1, -1)), [{ type: "italic" }]);
    } else if (code) {
      push(unescape(code.slice(1, -1)), [{ type: "code" }]);
    }
  }

  push(unescape(text.slice(last)));
  return nodes;
}

const para = (text: string): PmNode => ({
  type: "paragraph",
  ...(text ? { content: textToInline(text) } : {}),
});

export function blocksToTiptap(blocks: Block[]): PmNode {
  const content: PmNode[] = blocks.map((block): PmNode => {
    switch (block.type) {
      case "heading":
        return { type: "heading", attrs: { level: block.level }, content: textToInline(block.text) };
      case "paragraph":
        return para(block.text);
      case "list":
        return {
          type: block.ordered ? "orderedList" : "bulletList",
          content: block.items.map((item) => ({ type: "listItem", content: [para(item)] })),
        };
      case "quote":
        return { type: "blockquote", content: [para(block.text)] };
      case "code":
        return {
          type: "codeBlock",
          attrs: { language: block.language ?? null },
          ...(block.code ? { content: [{ type: "text", text: block.code }] } : {}),
        };
      case "divider":
        return { type: "horizontalRule" };
      case "image":
        return {
          type: "image",
          attrs: { src: block.src, alt: block.alt, title: block.caption ?? null },
        };
      case "table": {
        const rows: PmNode[] = [];
        if (block.header.length) {
          rows.push({
            type: "tableRow",
            content: block.header.map((cell) => ({ type: "tableHeader", content: [para(cell)] })),
          });
        }
        for (const row of block.rows) {
          rows.push({
            type: "tableRow",
            content: row.map((cell) => ({ type: "tableCell", content: [para(cell)] })),
          });
        }
        return { type: "table", content: rows };
      }
    }
  });

  // ProseMirror rejects an empty doc; give it somewhere to put the cursor.
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}
