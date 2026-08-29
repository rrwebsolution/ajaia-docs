"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DEBOUNCE_MS = 900;

export function useAutosave({
  documentId,
  title,
  content,
  enabled,
}: {
  documentId: string;
  title: string;
  content: JSONContent | null;
  enabled: boolean;
}) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const isFirstRun = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title, content });

  useEffect(() => {
    latest.current = { title, content };
  });

  useEffect(() => {
    if (!enabled) return;

    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    setStatus("saving");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latest.current),
        });

        if (!response.ok) throw new Error("save-failed");

        setStatus("saved");
      } catch {
        setStatus("error");
        toast.error("Failed to save changes. Retrying may help.");
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [title, content, documentId, enabled]);

  return status;
}
