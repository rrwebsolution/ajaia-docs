import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getDashboardDocuments } from "@/lib/documents";
import { DocumentsDashboard } from "@/components/documents/documents-dashboard";

export default async function DocumentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const { owned, shared } = await getDashboardDocuments(supabase, user.id);

  return (
    <DocumentsDashboard
      userName={profile?.name ?? user.email ?? "You"}
      userEmail={profile?.email ?? user.email ?? ""}
      owned={owned}
      shared={shared}
    />
  );
}
