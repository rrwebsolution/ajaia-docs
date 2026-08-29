"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, FileText, MoreVertical, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/format";
import type { DocumentListItem } from "@/types/document";

export function DocumentCard({
  document,
  onDeleted,
}: {
  document: DocumentListItem;
  onDeleted?: (id: string) => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("delete-failed");
      toast.success(`"${document.title}" deleted.`);
      onDeleted?.(document.id);
    } catch {
      toast.error("Unable to delete document. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <Card className="group relative flex flex-col gap-3 p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/documents/${document.id}`}
          className="flex min-w-0 flex-1 items-start gap-2.5"
        >
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <FileText className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium leading-snug">
              {document.title}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              Updated {formatRelativeTime(document.updated_at)}
            </span>
          </span>
        </Link>

        {document.isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                aria-label="Document actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/documents/${document.id}`}>Open</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={deleting}
                onSelect={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
              >
                <Trash2 />
                {deleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {document.isOwner ? (
          <Badge variant="secondary">Owned</Badge>
        ) : (
          <Badge variant="outline" className="border-primary/30 text-primary">
            Shared
          </Badge>
        )}
        {!document.isOwner && (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            {document.permission === "editor" ? (
              <PenLine className="size-3" />
            ) : (
              <Eye className="size-3" />
            )}
            {document.permission === "editor" ? "Can edit" : "Can view"}
          </Badge>
        )}
        <span className="truncate text-xs text-muted-foreground">
          {document.isOwner ? "You" : document.owner.name}
        </span>
      </div>
    </Card>
  );
}
