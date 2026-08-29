import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidDocumentTitle } from "@/lib/validators";
import { EMPTY_DOCUMENT_CONTENT } from "@/types/document";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
  const title = isValidDocumentTitle(rawTitle) ? rawTitle : "Untitled Document";
  const content =
    body.content && typeof body.content === "object"
      ? body.content
      : EMPTY_DOCUMENT_CONTENT;

  const { data, error } = await supabase
    .from("documents")
    .insert({ owner_id: user.id, title, content })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Unable to create document. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
