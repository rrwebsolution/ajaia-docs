import { describe, expect, it } from "vitest";
import { canEdit, canManageSharing, canView, resolveAccess } from "@/lib/permissions";
import type { SharePermission } from "@/types/document";

/**
 * In-memory stand-ins for the `documents` and `document_shares` tables.
 * resolveAccess() is the same access-decision logic the Postgres RLS
 * policies in supabase/migrations/0001_init.sql encode — testing it here
 * verifies the authorization contract without needing a live database.
 */
interface FakeDocumentsTable {
  documents: Map<string, { id: string; owner_id: string }>;
  shares: Array<{ document_id: string; user_id: string; permission: SharePermission }>;
}

function createDatabase(): FakeDocumentsTable {
  return { documents: new Map(), shares: [] };
}

function createDocument(db: FakeDocumentsTable, id: string, ownerId: string) {
  db.documents.set(id, { id, owner_id: ownerId });
}

function shareDocument(
  db: FakeDocumentsTable,
  documentId: string,
  userId: string,
  permission: SharePermission,
) {
  db.shares.push({ document_id: documentId, user_id: userId, permission });
}

function accessFor(db: FakeDocumentsTable, documentId: string, userId: string) {
  const document = db.documents.get(documentId) ?? null;
  const shares = db.shares.filter((s) => s.document_id === documentId);
  return resolveAccess({ currentUserId: userId, document, shares });
}

describe("document access control", () => {
  const OWNER_ID = "owner-uuid";
  const COLLABORATOR_ID = "collaborator-uuid";
  const DOC_ID = "doc-uuid";

  it("allows a shared user to access a document after the owner shares it", () => {
    const db = createDatabase();

    // 1. Owner creates document.
    createDocument(db, DOC_ID, OWNER_ID);

    // 2. Collaborator initially cannot access it.
    const beforeShare = accessFor(db, DOC_ID, COLLABORATOR_ID);
    expect(beforeShare).toBe("none");
    expect(canView(beforeShare)).toBe(false);

    // 3. Owner shares document with collaborator (editor permission).
    shareDocument(db, DOC_ID, COLLABORATOR_ID, "editor");

    // 4. Collaborator can access it.
    const afterShare = accessFor(db, DOC_ID, COLLABORATOR_ID);
    expect(afterShare).toBe("editor");
    expect(canView(afterShare)).toBe(true);
    expect(canEdit(afterShare)).toBe(true);
    expect(canManageSharing(afterShare)).toBe(false);

    // Owner retains full access throughout.
    const ownerAccess = accessFor(db, DOC_ID, OWNER_ID);
    expect(ownerAccess).toBe("owner");
    expect(canManageSharing(ownerAccess)).toBe(true);
  });

  it("rejects unauthorized access to a document with no share", () => {
    const db = createDatabase();
    createDocument(db, DOC_ID, OWNER_ID);

    const strangerAccess = accessFor(db, DOC_ID, "someone-else-uuid");

    expect(strangerAccess).toBe("none");
    expect(canView(strangerAccess)).toBe(false);
    expect(canEdit(strangerAccess)).toBe(false);
  });

  it("restricts a viewer share to read-only access", () => {
    const db = createDatabase();
    createDocument(db, DOC_ID, OWNER_ID);
    shareDocument(db, DOC_ID, COLLABORATOR_ID, "viewer");

    const access = accessFor(db, DOC_ID, COLLABORATOR_ID);

    expect(access).toBe("viewer");
    expect(canView(access)).toBe(true);
    expect(canEdit(access)).toBe(false);
  });

  it("returns 'none' for a missing document or anonymous user", () => {
    const db = createDatabase();
    createDocument(db, DOC_ID, OWNER_ID);

    expect(accessFor(db, "nonexistent-doc", COLLABORATOR_ID)).toBe("none");
    expect(
      resolveAccess({ currentUserId: null, document: db.documents.get(DOC_ID), shares: [] }),
    ).toBe("none");
  });
});
