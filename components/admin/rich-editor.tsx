"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Table as TableIcon,
  Undo2,
} from "lucide-react";
import { blocksToTiptap, tiptapToBlocks } from "@/lib/cms/tiptap";
import { uploadMedia } from "@/lib/admin/api";
import type { Block } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

/**
 * The article body editor.
 *
 * Owns a ProseMirror document internally and reports stored blocks outward, so nothing
 * above it deals with editor internals. It is deliberately UNCONTROLLED: pushing the
 * parent's value back in on every keystroke fights ProseMirror for cursor position. The
 * document is set once on mount and replaced only when `resetKey` changes — which the
 * Markdown importer and a version restore do, because those legitimately replace the
 * whole body.
 *
 * Images dropped or pasted in are uploaded to Supabase Storage and inserted by URL.
 */
export function RichEditor({
  value,
  onChange,
  resetKey,
}: {
  value: Block[];
  onChange: (blocks: Block[]) => void;
  /** Change this to force the document to be replaced from `value`. */
  resetKey?: string | number;
}) {
  // The editor's `onUpdate` closure is created once, so it reads the latest handler
  // through a ref rather than capturing the first one. Assigned in an effect, never
  // during render — a ref written while rendering is not a re-render trigger and is
  // unsafe under concurrent rendering.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    // Rendered on the client only; without this Next warns about an SSR/DOM mismatch.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener" } }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: blocksToTiptap(value),
    editorProps: {
      attributes: {
        class: "article min-h-[24rem] max-w-none px-4 py-4 focus:outline-none",
      },
      handlePaste: (view, event) => handleFiles(Array.from(event.clipboardData?.files ?? [])),
      handleDrop: (view, event) => {
        const dropped = Array.from((event as DragEvent).dataTransfer?.files ?? []);
        return handleFiles(dropped);
      },
    },
    onUpdate: ({ editor }) => {
      onChangeRef.current(tiptapToBlocks(editor.getJSON() as never));
    },
  });

  /** Returns true when it consumed the event, so ProseMirror stops handling it. */
  function handleFiles(files: File[]): boolean {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return false;

    void (async () => {
      for (const file of images) {
        try {
          const media = await uploadMedia(file);
          editor?.chain().focus().setImage({ src: media.url, alt: "" }).run();
        } catch (error) {
          console.error("[editor] image upload failed:", error);
          window.alert(error instanceof Error ? error.message : "Image upload failed.");
        }
      }
    })();
    return true;
  }

  useEffect(() => {
    if (!editor || resetKey === undefined) return;
    // `false` — do not emit an update, or this would immediately call back with the
    // same blocks the parent just handed in.
    editor.commands.setContent(blocksToTiptap(value) as never, { emitUpdate: false });
    // `value` is intentionally not a dependency: reacting to it would make the editor
    // controlled again. Only an explicit resetKey change replaces the document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, editor]);

  if (!editor) {
    return (
      <div className="rounded-md border border-border bg-white px-4 py-10 text-sm text-muted">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-white">
      <Toolbar editor={editor} onPickImage={handleFiles} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage: (files: File[]) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);

  const addLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL", previous ?? "https://");
    if (href === null) return;
    if (!href) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface px-2 py-1.5">
      <Tool
        icon={Bold}
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <Tool
        icon={Italic}
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <Tool
        icon={Code}
        title="Inline code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <Divider />
      <Tool
        icon={Heading2}
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <Tool
        icon={Heading3}
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <Divider />
      <Tool
        icon={List}
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <Tool
        icon={ListOrdered}
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <Tool
        icon={Quote}
        title="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <Divider />
      <Tool icon={Link2} title="Link" active={editor.isActive("link")} onClick={addLink} />
      <Tool icon={ImagePlus} title="Insert image" onClick={() => fileInput.current?.click()} />
      <Tool
        icon={TableIcon}
        title="Insert table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      />
      <Tool
        icon={Minus}
        title="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      <Divider />
      <Tool
        icon={Undo2}
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      />
      <Tool
        icon={Redo2}
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      />

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          onPickImage(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Tool({
  icon: Icon,
  title,
  active,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded p-1.5 transition-colors disabled:opacity-40",
        active ? "bg-navy-900 text-white" : "text-muted hover:bg-white hover:text-navy-900",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-border" />;
