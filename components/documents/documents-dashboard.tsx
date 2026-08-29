"use client";

import { useMemo, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { DocumentCard } from "@/components/documents/document-card";
import { DocumentEmptyState } from "@/components/documents/document-empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateDocument } from "@/hooks/use-create-document";
import type { DocumentListItem } from "@/types/document";

export function DocumentsDashboard({
  userName,
  userEmail,
  owned,
  shared,
}: {
  userName: string;
  userEmail: string;
  owned: DocumentListItem[];
  shared: DocumentListItem[];
}) {
  const [search, setSearch] = useState("");
  const [ownedDocs, setOwnedDocs] = useState(owned);
  const { createDocument } = useCreateDocument();

  const query = search.trim().toLowerCase();

  const filteredOwned = useMemo(
    () => ownedDocs.filter((doc) => doc.title.toLowerCase().includes(query)),
    [ownedDocs, query],
  );
  const filteredShared = useMemo(
    () => shared.filter((doc) => doc.title.toLowerCase().includes(query)),
    [shared, query],
  );

  return (
    <div className="min-h-dvh bg-muted/30">
      <AppHeader
        userName={userName}
        userEmail={userEmail}
        search={search}
        onSearchChange={setSearch}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">My Documents</TabsTrigger>
            <TabsTrigger value="shared">Shared With Me</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="mt-6">
            {filteredOwned.length === 0 ? (
              <DocumentEmptyState
                variant={query ? "no-results" : "no-documents"}
                onCreate={query ? undefined : createDocument}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredOwned.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onDeleted={(id) =>
                      setOwnedDocs((prev) => prev.filter((d) => d.id !== id))
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared" className="mt-6">
            {filteredShared.length === 0 ? (
              <DocumentEmptyState variant={query ? "no-results" : "no-shared"} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredShared.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
