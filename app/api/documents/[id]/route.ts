import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidDocumentTitle } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!isValidDocumentTitle(title)) {
      return NextResponse.json(
        { error: "Document title cannot be empty." },
        { status: 400 },
      );
    }
    update.title = title;
  }

  if (body.content !== undefined) {
    if (typeof body.content !== "object" || body.content === null) {
      return NextResponse.json({ error: "Invalid document content." }, { status: 400 });
    }
    update.content = body.content;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("documents")
    .update(update)
    .eq("id", id)
    .select("id, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to save changes. Please try again." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "You don't have access to this document." },
      { status: 403 },
    );
  }

  return NextResponse.json({ id: data.id, updated_at: data.updated_at });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete document. Please try again." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "You don't have access to delete this document." },
      { status: 403 },
    );
  }

  return NextResponse.json({ success: true });
}
