"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { ArrowLeft, Eye, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { SaveStatusIndicator } from "@/components/editor/save-status-indicator";
import { ShareDialog } from "@/components/sharing/share-dialog";
import { useAutosave } from "@/hooks/use-autosave";
import { isValidDocumentTitle } from "@/lib/validators";

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  isOwner,
  canEdit,
}: {
  documentId: string;
  initialTitle: string;
  initialContent: JSONContent;
  isOwner: boolean;
  canEdit: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<JSONContent | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: initialContent,
    editable: canEdit,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getJSON());
    },
  });

  const status = useAutosave({
    documentId,
    title,
    content,
    enabled: canEdit,
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(canEdit);
  }, [editor, canEdit]);

  useEffect(() => {
    const textarea = titleRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [title]);

  function handleTitleBlur() {
    if (!isValidDocumentTitle(title)) {
      toast.error("Document title cannot be empty.");
      setTitle(initialTitle || "Untitled Document");
    }
  }

  function handleTitleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      editor?.commands.focus("start");
    }
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col bg-muted/30">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5 sm:px-6">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href="/documents" aria-label="Back to Documents">
                <ArrowLeft />
              </Link>
            </Button>

            {canEdit ? (
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                rows={1}
                aria-label="Document title"
                className="min-w-0 flex-1 resize-none overflow-hidden rounded-md bg-transparent px-2 py-1 text-base leading-snug font-semibold break-words outline-none ring-ring/50 focus-visible:ring-2 sm:text-lg"
              />
            ) : (
              <span className="min-w-0 flex-1 break-words px-2 py-1 text-base font-semibold sm:text-lg">
                {title}
              </span>
            )}

            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <SaveStatusIndicator status={status} />
            </div>

            {isOwner ? (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => setShareOpen(true)}
              >
                <Share2 />
                <span className="hidden sm:inline">Share</span>
              </Button>
            ) : (
              <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
                <Eye className="size-3" />
                {canEdit ? "Can edit" : "Can view"}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-end px-4 pb-2 sm:hidden">
            <SaveStatusIndicator status={status} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4 sm:px-6 sm:py-8">
          {canEdit && (
            <div className="mb-4 sm:sticky sm:top-16 sm:z-20">
              <EditorToolbar editor={editor} />
            </div>
          )}

          <div className="rounded-xl border bg-card px-5 py-8 shadow-sm sm:px-12 sm:py-12">
            <EditorContent editor={editor} />
          </div>
        </main>
      </div>

      {isOwner && (
        <ShareDialog
          documentId={documentId}
          documentTitle={title}
          open={shareOpen}
          onOpenChange={setShareOpen}
        />
      )}
    </TooltipProvider>
  );
}
