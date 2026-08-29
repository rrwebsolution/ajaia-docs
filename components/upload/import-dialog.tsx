"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fileNameToTitle, validateImportFile } from "@/lib/validators";
import { markdownToTiptapDoc, textToTiptapDoc } from "@/lib/markdown";

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function processFile(file: File) {
    setError(null);

    const result = validateImportFile(file);
    if (!result.valid) {
      setError(result.error!);
      return;
    }

    setImporting(true);

    try {
      const text = await file.text();
      const isMarkdown = file.name.toLowerCase().endsWith(".md");
      const content = isMarkdown ? markdownToTiptapDoc(text) : textToTiptapDoc(text);
      const title = fileNameToTitle(file.name);

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        throw new Error("import-failed");
      }

      const data = await response.json();
      toast.success(`"${title}" imported successfully.`);
      onOpenChange(false);
      router.push(`/documents/${data.id}`);
    } catch {
      setError("Unable to import this document.");
      setImporting(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) processFile(file);
  }

  function resetAndClose(next: boolean) {
    if (!importing) {
      setError(null);
      onOpenChange(next);
    }
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Document</DialogTitle>
          <DialogDescription>
            Bring an existing plain-text or markdown file into Ajaia Docs.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => !importing && inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
            importing && "pointer-events-none opacity-70",
          )}
        >
          {importing ? (
            <Loader2 className="size-8 animate-spin text-primary" />
          ) : (
            <UploadCloud className="size-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {importing ? "Importing..." : "Drop a file here or click to browse"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Supports .txt and .md files, up to 2 MB.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={importing}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileUp className="size-3.5" />
          Only .txt and .md files are supported.
        </div>
      </DialogContent>
    </Dialog>
  );
}
