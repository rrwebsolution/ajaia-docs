"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useCreateDocument() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function createDocument() {
    setCreating(true);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Document" }),
      });

      if (!response.ok) throw new Error("create-failed");

      const data = await response.json();
      router.push(`/documents/${data.id}`);
    } catch {
      toast.error("Unable to create document. Please try again.");
      setCreating(false);
    }
  }

  return { createDocument, creating };
}
