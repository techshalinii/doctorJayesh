"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { FaqItem } from "@/lib/cms/types";
import { AdminButton, Input, Textarea } from "@/components/admin/ui";

/**
 * Question/answer pairs for the article's FAQ section.
 *
 * Order matters — it is the order they render in and the order they appear in the
 * FAQPage JSON-LD — so the rows can be moved rather than only added and removed.
 *
 * An item is only emitted to the page when BOTH fields are filled (see `parseFaq` in
 * lib/cms/posts.ts), which is what stops a half-typed question becoming structured
 * data claiming an answer the page does not contain.
 */
export function FaqEditor({
  value,
  onChange,
}: {
  value: FaqItem[];
  onChange: (next: FaqItem[]) => void;
}) {
  const update = (index: number, patch: Partial<FaqItem>) =>
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 && (
        <p className="text-sm text-muted">
          No FAQ items. Questions added here render under the article and are emitted as
          FAQPage structured data — so only add questions the article actually answers.
        </p>
      )}

      {value.map((item, i) => (
        <div key={i} className="rounded-md border border-border p-3">
          <div className="flex items-start gap-2">
            <Input
              value={item.question}
              onChange={(e) => update(i, { question: e.target.value })}
              placeholder="Question"
              aria-label={`Question ${i + 1}`}
            />
            <div className="flex shrink-0 items-center">
              <AdminButton
                variant="ghost"
                className="!px-1.5 !py-1.5"
                title="Move up"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ChevronUp className="h-4 w-4" />
              </AdminButton>
              <AdminButton
                variant="ghost"
                className="!px-1.5 !py-1.5"
                title="Move down"
                disabled={i === value.length - 1}
                onClick={() => move(i, 1)}
              >
                <ChevronDown className="h-4 w-4" />
              </AdminButton>
              <AdminButton
                variant="ghost"
                className="!px-1.5 !py-1.5 hover:!bg-red-50 hover:!text-red-700"
                title="Remove"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </AdminButton>
            </div>
          </div>
          <Textarea
            className="mt-2"
            rows={3}
            value={item.answer}
            onChange={(e) => update(i, { answer: e.target.value })}
            placeholder="Answer"
            aria-label={`Answer ${i + 1}`}
          />
        </div>
      ))}

      <AdminButton
        className="self-start"
        onClick={() => onChange([...value, { question: "", answer: "" }])}
      >
        <Plus className="h-4 w-4" /> Add question
      </AdminButton>
    </div>
  );
}
