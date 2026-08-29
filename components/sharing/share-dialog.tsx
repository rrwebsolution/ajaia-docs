"use client";

import { useEffect, useState } from "react";
import { Loader2, UserMinus, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isValidEmail } from "@/lib/validators";
import type { SharePermission } from "@/types/document";

interface ShareEntry {
  id: string;
  permission: SharePermission;
  user: { id: string; name: string; email: string };
}

interface ShareData {
  document: {
    id: string;
    title: string;
    owner: { id: string; name: string; email: string };
  };
  shares: ShareEntry[];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function ShareDialog({
  documentId,
  documentTitle,
  open,
  onOpenChange,
}: {
  documentId: string;
  documentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<SharePermission>("editor");
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadShares() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/documents/${documentId}/share`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Unable to load collaborators.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadShares();

    return () => {
      cancelled = true;
    };
  }, [open, documentId]);

  async function handleShare(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setSharing(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, permission }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error ?? "Unable to share document. Please try again.");
        return;
      }

      setData((prev) =>
        prev ? { ...prev, shares: [...prev.shares, json.share] } : prev,
      );
      setEmail("");
      toast.success("Document shared successfully.");
    } catch {
      setError("Unable to share document. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  async function handleRemove(shareId: string) {
    setRemovingId(shareId);
    try {
      const response = await fetch(
        `/api/documents/${documentId}/share?shareId=${shareId}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error();
      setData((prev) =>
        prev
          ? { ...prev, shares: prev.shares.filter((s) => s.id !== shareId) }
          : prev,
      );
      toast.success("Collaborator removed.");
    } catch {
      toast.error("Unable to remove collaborator. Please try again.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate">
            Share &ldquo;{documentTitle}&rdquo;
          </DialogTitle>
          <DialogDescription>
            Invite someone to collaborate on this document.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleShare} className="space-y-2">
          <Label htmlFor="share-email">Add a person</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="share-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sharing}
              className="flex-1 min-w-0"
            />
            <div className="flex gap-2">
              <Select
                value={permission}
                onValueChange={(v) => setPermission(v as SharePermission)}
              >
                <SelectTrigger className="w-32 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Can edit</SelectItem>
                  <SelectItem value="viewer">Can view</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={sharing} className="shrink-0">
                {sharing && <Loader2 className="animate-spin" />}
                Share
              </Button>
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">People with access</p>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {data?.document.owner && (
                <div className="flex items-center gap-3 rounded-md px-1 py-2">
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(data.document.owner.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{data.document.owner.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {data.document.owner.email}
                    </p>
                  </div>
                  <Badge variant="secondary">Owner</Badge>
                </div>
              )}

              {data?.shares.map((share) => (
                <div
                  key={share.id}
                  className="group flex items-center gap-3 rounded-md px-1 py-2 hover:bg-muted/60"
                >
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(share.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{share.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {share.user.email}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {share.permission === "editor" ? "Can edit" : "Can view"}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
                    disabled={removingId === share.id}
                    onClick={() => handleRemove(share.id)}
                    aria-label={`Remove ${share.user.name}`}
                  >
                    {removingId === share.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <X className="size-3.5" />
                    )}
                  </Button>
                </div>
              ))}

              {data && data.shares.length === 0 && (
                <p className="flex items-center gap-2 px-1 py-3 text-sm text-muted-foreground">
                  <UserMinus className="size-4" />
                  No collaborators yet.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
