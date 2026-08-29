import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/validators";
import type { SharePermission } from "@/types/document";

export async function GET(
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

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, title, owner_id, owner:profiles!documents_owner_id_fkey(id, name, email)")
    .eq("id", id)
    .maybeSingle();

  if (documentError || !document) {
    return NextResponse.json(
      { error: "You don't have access to this document." },
      { status: 403 },
    );
  }

  if (document.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Only the document owner can manage sharing." },
      { status: 403 },
    );
  }

  const { data: shares, error: sharesError } = await supabase
    .from("document_shares")
    .select("id, permission, created_at, user:profiles!document_shares_user_id_fkey(id, name, email)")
    .eq("document_id", id)
    .order("created_at", { ascending: true });

  if (sharesError) {
    return NextResponse.json(
      { error: "Unable to load collaborators." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    document: { id: document.id, title: document.title, owner: document.owner },
    shares,
  });
}

export async function POST(
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
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const permission: SharePermission = body?.permission === "viewer" ? "viewer" : "editor";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (documentError || !document) {
    return NextResponse.json(
      { error: "You don't have access to this document." },
      { status: 403 },
    );
  }

  if (document.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Only the document owner can manage sharing." },
      { status: 403 },
    );
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, name, email")
    .ilike("email", email)
    .maybeSingle();

  if (!targetProfile) {
    return NextResponse.json(
      { error: "No user found with this email." },
      { status: 404 },
    );
  }

  if (targetProfile.id === user.id) {
    return NextResponse.json(
      { error: "You already own this document." },
      { status: 409 },
    );
  }

  const { data: existingShare } = await supabase
    .from("document_shares")
    .select("id")
    .eq("document_id", id)
    .eq("user_id", targetProfile.id)
    .maybeSingle();

  if (existingShare) {
    return NextResponse.json(
      { error: "This document is already shared with this user." },
      { status: 409 },
    );
  }

  const { data: share, error: insertError } = await supabase
    .from("document_shares")
    .insert({ document_id: id, user_id: targetProfile.id, permission })
    .select("id, permission, created_at, user:profiles!document_shares_user_id_fkey(id, name, email)")
    .single();

  if (insertError || !share) {
    return NextResponse.json(
      { error: "Unable to share document. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ share }, { status: 201 });
}

export async function DELETE(
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

  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return NextResponse.json({ error: "Missing shareId." }, { status: 400 });
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (!document || document.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Only the document owner can manage sharing." },
      { status: 403 },
    );
  }

  const { error: deleteError } = await supabase
    .from("document_shares")
    .delete()
    .eq("id", shareId)
    .eq("document_id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Unable to remove collaborator." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
