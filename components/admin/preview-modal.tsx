"use client";

import { renderBlocks } from "@/lib/cms/blocks";
import { formatInZone } from "@/lib/admin/timezone";
import type { Block, FaqItem } from "@/lib/cms/types";
import { Modal } from "@/components/admin/ui";

/**
 * Live preview of the article as it is being written.
 *
 * Rendered with the SAME `renderBlocks()` the public page uses and inside the same
 * `.article` prose styles, so what is shown here is what will ship — a preview built
 * from a second renderer would be a preview of something else.
 *
 * It also shows the Google result the current SEO title and meta description would
 * produce, at the widths Google actually truncates at, which is what makes the numbers
 * in the SEO panel concrete.
 */
export function PreviewModal({
  onClose,
  title,
  excerpt,
  blocks,
  faq,
  seoTitle,
  metaDescription,
  slug,
  publishAt,
  timeZone,
  readTime,
}: {
  onClose: () => void;
  title: string;
  excerpt: string;
  blocks: Block[];
  faq: FaqItem[];
  seoTitle: string;
  metaDescription: string;
  slug: string;
  publishAt: string | null;
  timeZone: string;
  readTime: number;
}) {
  const html = renderBlocks(blocks);

  return (
    <Modal title="Preview" onClose={onClose} wide>
      <div className="flex flex-col gap-8">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-700">
            Search result
          </h3>
          <div className="mt-3 max-w-[38rem] rounded-md border border-border p-4">
            <p className="truncate text-xs text-emerald-800">
              drjayeshsardhara.com › {slug || "…"}
            </p>
            <p className="mt-0.5 truncate text-lg text-[#1a0dab]">
              {seoTitle || title || "Untitled"}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-[#4d5156]">
              {metaDescription || excerpt || "No description set."}
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-700">Article</h3>
          <div className="mt-3 rounded-md border border-border p-5 sm:p-8">
            <div className="text-xs uppercase tracking-wider text-muted">
              {readTime} min read
              {publishAt && <> · {formatInZone(publishAt, timeZone)}</>}
            </div>
            <h1 className="mt-3 font-display text-3xl font-medium leading-tight text-navy-900">
              {title || "Untitled"}
            </h1>
            {excerpt && (
              <p className="mt-5 border-l-2 border-teal-500 pl-4 font-display text-lg font-medium leading-relaxed text-navy-800">
                {excerpt}
              </p>
            )}
            <div className="article mt-6" dangerouslySetInnerHTML={{ __html: html }} />

            {faq.filter((f) => f.question && f.answer).length > 0 && (
              <div className="mt-10 border-t border-border pt-6">
                <h2 className="font-display text-xl font-medium text-navy-900">
                  Frequently asked questions
                </h2>
                <dl className="mt-5 space-y-5">
                  {faq
                    .filter((f) => f.question && f.answer)
                    .map((item, i) => (
                      <div key={i}>
                        <dt className="font-display text-base font-medium text-navy-900">
                          {item.question}
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed text-muted">{item.answer}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
