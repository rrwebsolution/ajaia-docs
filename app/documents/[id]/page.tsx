import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { resolveAccess, canEdit as canEditAccess } from "@/lib/permissions";
import { AccessDenied } from "@/components/documents/access-denied";
import { DocumentEditor } from "@/components/editor/document-editor";
import { EMPTY_DOCUMENT_CONTENT } from "@/types/document";
import type { JSONContent } from "@tiptap/react";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, owner_id, title, content")
    .eq("id", id)
    .maybeSingle();

  if (!document) {
    return <AccessDenied />;
  }

  const { data: shares } = await supabase
    .from("document_shares")
    .select("user_id, permission")
    .eq("document_id", id)
    .eq("user_id", user.id);

  const access = resolveAccess({
    currentUserId: user.id,
    document,
    shares: shares ?? [],
  });

  if (access === "none") {
    return <AccessDenied />;
  }

  return (
    <DocumentEditor
      documentId={document.id}
      initialTitle={document.title}
      initialContent={(document.content as JSONContent) ?? EMPTY_DOCUMENT_CONTENT}
      isOwner={access === "owner"}
      canEdit={canEditAccess(access)}
    />
  );
}
