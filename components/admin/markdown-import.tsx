"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import { importMarkdown, type ImportedPost } from "@/lib/cms/markdown-import";
import { AdminButton, Banner, Modal, Textarea } from "@/components/admin/ui";

/**
 * Paste or drop a Markdown draft and have every field filled in.
 *
 * The parse itself lives in lib/cms/markdown-import.ts; this is the surface around it.
 * Two things it does on purpose:
 *
 * - It shows a preview of what will be filled BEFORE replacing anything, because import
 *   overwrites the whole form and an accidental one is annoying to undo.
 * - It surfaces the parser's warnings rather than hiding them. The most important is
 *   the missing SEO title: that field is left blank when the draft has no explicit
 *   "SEO title:" line, and the author should know it was left blank deliberately
 *   rather than assume it was filled from the H1.
 */
export function MarkdownImport({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (post: ImportedPost) => void;
}) {
  const [source, setSource] = useState("");
  const [parsed, setParsed] = useState<ImportedPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  if (!open) return null;

  const parse = (text: string) => {
    setSource(text);
    setError(null);
    if (!text.trim()) {
      setParsed(null);
      return;
    }
    try {
      setParsed(importMarkdown(text));
    } catch (e) {
      setParsed(null);
      setError(e instanceof Error ? e.message : "Could not parse this Markdown.");
    }
  };

  const readFile = async (file: File) => {
    if (!/\.(md|markdown|txt)$/i.test(file.name) && file.type !== "text/markdown") {
      setError("Expected a .md file.");
      return;
    }
    parse(await file.text());
  };

  return (
    <Modal title="Import from Markdown" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-muted">
          Paste the draft below, or drop a <code>.md</code> file on it. Frontmatter and a leading{" "}
          <code>&lt;!-- Key: value --&gt;</code> block are both read — including{" "}
          <code>SEO title</code>, <code>Meta description</code> and <code>Primary query</code>. A{" "}
          <code>## FAQ</code> section becomes FAQ items and a <code>## Related</code> section
          becomes related links.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) void readFile(file);
          }}
          className={dragging ? "rounded-md ring-2 ring-teal-400" : undefined}
        >
          <Textarea
            rows={12}
            value={source}
            onChange={(e) => parse(e.target.value)}
            placeholder={"<!--\nSEO title: …\nMeta description: …\nPrimary query: …\n-->\n\n# Heading\n\nBody…"}
            className="font-mono text-xs"
            aria-label="Markdown source"
          />
        </div>

        <label className="inline-flex cursor-pointer items-center gap-1.5 self-start text-sm text-muted hover:text-navy-900">
          <FileUp className="h-4 w-4" /> Choose a .md file
          <input
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void readFile(file);
              e.target.value = "";
            }}
          />
        </label>

        {error && <Banner tone="error">{error}</Banner>}

        {parsed && (
          <>
            <div className="rounded-md border border-border">
              <table className="w-full text-sm">
                <tbody>
                  <Row label="Title" value={parsed.title} />
                  <Row label="Slug" value={parsed.slug ? `/${parsed.slug}/` : ""} />
                  <Row label="SEO title" value={parsed.seo_title} />
                  <Row label="Meta description" value={parsed.meta_description} />
                  <Row label="Focus keyword" value={parsed.focus_keyword} />
                  <Row label="Category" value={parsed.category} />
                  <Row label="Tags" value={parsed.tags.join(", ")} />
                  <Row label="Body" value={`${parsed.content.length} blocks · ${parsed.read_time} min read`} />
                  <Row label="FAQ" value={parsed.faq.length ? `${parsed.faq.length} questions` : ""} />
                  <Row label="Related" value={parsed.related_blogs.join(", ")} />
                </tbody>
              </table>
            </div>

            {parsed.warnings.length > 0 && (
              <Banner tone="warn">
                <ul className="list-disc space-y-1 pl-4">
                  {parsed.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </Banner>
            )}

            <div className="flex justify-end gap-2">
              <AdminButton onClick={onClose}>Cancel</AdminButton>
              <AdminButton variant="primary" onClick={() => onImport(parsed)}>
                Fill the editor
              </AdminButton>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <th className="w-40 whitespace-nowrap px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </th>
      <td className="px-3 py-1.5 text-navy-900">
        {value || <span className="text-muted">— not found</span>}
      </td>
    </tr>
  );
}
