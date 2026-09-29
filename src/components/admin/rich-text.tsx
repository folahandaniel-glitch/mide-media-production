"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TextAlign } from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({ on, active, label, children }: { on: () => void; active?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn("grid h-8 w-8 place-items-center rounded-md text-white/65 transition hover:bg-white/10 hover:text-white", active && "bg-brand/20 text-brand")}
    >
      {children}
    </button>
  );
}

/** Simple, safe rich text editor. Output is sanitised again on the server. */
export function RichTextEditor({ id, value, onChange, label }: { id: string; value: string; onChange: (html: string) => void; label: string }) {
  const editor = useEditor({
    immediatelyRender: true, // loaded client-only via next/dynamic (see fields.tsx)
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        code: false,
        link: { openOnClick: false, autolink: true, protocols: ["mailto", "tel"], HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        id,
        "aria-label": label,
        "aria-multiline": "true",
        role: "textbox",
        class: "prose-cinema min-h-[180px] max-w-none px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
    // Re-render on selection/format changes so toolbar buttons reflect the active formatting.
    shouldRerenderOnTransaction: true,
  });

  if (!editor) return <div className="skeleton h-[230px] rounded-xl" />;

  const state = {
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
    underline: editor.isActive("underline"),
    h2: editor.isActive("heading", { level: 2 }),
    h3: editor.isActive("heading", { level: 3 }),
    ul: editor.isActive("bulletList"),
    ol: editor.isActive("orderedList"),
    quote: editor.isActive("blockquote"),
    link: editor.isActive("link"),
    left: editor.isActive({ textAlign: "left" }),
    center: editor.isActive({ textAlign: "center" }),
    right: editor.isActive({ textAlign: "right" }),
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (https://…, /page, mailto: or tel:)", prev ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(url.trim())) {
      window.alert("Please enter a valid link starting with https://, /, mailto: or tel:");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };


  return (
    <div className="overflow-hidden rounded-xl border border-white/12 bg-white/[0.03] focus-within:border-brand">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 bg-black/30 p-1.5" role="toolbar" aria-label="Formatting">
        <ToolbarButton label="Bold" active={state.bold} on={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={state.italic} on={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Underline" active={state.underline} on={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <ToolbarButton label="Heading" active={state.h2} on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Subheading" active={state.h3} on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Bullet list" active={state.ul} on={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={state.ol} on={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Quote" active={state.quote} on={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <ToolbarButton label="Add link" active={state.link} on={setLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        {state.link && (
          <ToolbarButton label="Remove link" on={() => editor.chain().focus().unsetLink().run()}>
            <Unlink className="h-4 w-4" />
          </ToolbarButton>
        )}
        <span className="mx-1 h-5 w-px bg-white/10" />
        <ToolbarButton label="Align left" active={state.left} on={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Align centre" active={state.center} on={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Align right" active={state.right} on={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <span className="ml-auto flex">
          <ToolbarButton label="Undo" on={() => editor.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Redo" on={() => editor.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
