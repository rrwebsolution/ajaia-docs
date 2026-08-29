import type { SharePermission } from "@/types/document";

export type AccessLevel = "owner" | "editor" | "viewer" | "none";

export interface AccessInput {
  currentUserId: string | null | undefined;
  document: { owner_id: string } | null | undefined;
  shares: Array<{ user_id: string; permission: SharePermission }>;
}

/**
 * Single source of truth for "who can see/edit this document". Mirrors the
 * Postgres RLS policies in supabase/migrations/0001_init.sql — this copy is
 * what the UI uses to decide what to render, while RLS is what actually
 * enforces access at the database layer. Both must agree.
 */
export function resolveAccess({
  currentUserId,
  document,
  shares,
}: AccessInput): AccessLevel {
  if (!currentUserId || !document) return "none";
  if (document.owner_id === currentUserId) return "owner";

  const share = shares.find((s) => s.user_id === currentUserId);
  if (!share) return "none";

  return share.permission === "editor" ? "editor" : "viewer";
}

export function canView(access: AccessLevel): boolean {
  return access !== "none";
}

export function canEdit(access: AccessLevel): boolean {
  return access === "owner" || access === "editor";
}

export function canManageSharing(access: AccessLevel): boolean {
  return access === "owner";
}
