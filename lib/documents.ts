import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentListItem } from "@/types/document";

interface OwnerRow {
  id: string;
  name: string;
  email: string;
}

interface OwnedDocumentRow {
  id: string;
  title: string;
  updated_at: string;
  owner: OwnerRow | OwnerRow[] | null;
}

interface SharedDocumentRow {
  permission: "editor" | "viewer";
  document:
    | (Omit<OwnedDocumentRow, "owner"> & { owner: OwnerRow | OwnerRow[] | null })
    | null;
}

function firstOwner(owner: OwnerRow | OwnerRow[] | null): OwnerRow {
  if (!owner) return { id: "", name: "Unknown", email: "" };
  return Array.isArray(owner) ? owner[0]! : owner;
}

export async function getDashboardDocuments(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ owned: DocumentListItem[]; shared: DocumentListItem[] }> {
  const [ownedResult, sharedResult] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, updated_at, owner:profiles!documents_owner_id_fkey(id, name, email)")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("document_shares")
      .select(
        "permission, document:documents!document_shares_document_id_fkey(id, title, updated_at, owner:profiles!documents_owner_id_fkey(id, name, email))",
      )
      .eq("user_id", userId),
  ]);

  const owned: DocumentListItem[] = ((ownedResult.data ?? []) as unknown as OwnedDocumentRow[]).map(
    (doc) => ({
      id: doc.id,
      title: doc.title,
      updated_at: doc.updated_at,
      owner: firstOwner(doc.owner),
      isOwner: true,
      permission: "owner" as const,
    }),
  );

  const sharedRows = (sharedResult.data ?? []) as unknown as SharedDocumentRow[];
  const shared: DocumentListItem[] = sharedRows
    .filter((row) => row.document !== null)
    .map((row) => {
      const doc = row.document!;
      return {
        id: doc.id,
        title: doc.title,
        updated_at: doc.updated_at,
        owner: firstOwner(doc.owner),
        isOwner: false,
        permission: row.permission,
      };
    })
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));

  return { owned, shared };
}
