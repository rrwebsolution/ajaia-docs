"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Plus, Search, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { ImportDialog } from "@/components/upload/import-dialog";
import { useCreateDocument } from "@/hooks/use-create-document";

export function AppHeader({
  userName,
  userEmail,
  search,
  onSearchChange,
}: {
  userName: string;
  userEmail: string;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const { createDocument, creating } = useCreateDocument();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/documents" className="flex items-center gap-2 shrink-0">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">Ajaia Docs</span>
          </Link>

          <div className="lg:hidden">
            <ProfileDropdown name={userName} email={userEmail} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search documents..."
              aria-label="Search documents"
              className="pl-9"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="shrink-0"
          >
            <Upload />
            <span className="hidden sm:inline">Import</span>
          </Button>

          <Button
            size="sm"
            onClick={createDocument}
            disabled={creating}
            className="shrink-0"
          >
            {creating ? <Loader2 className="animate-spin" /> : <Plus />}
            <span className="hidden sm:inline">
              {creating ? "Creating..." : "New Document"}
            </span>
          </Button>

          <div className="hidden lg:block">
            <ProfileDropdown name={userName} email={userEmail} />
          </div>
        </div>
      </div>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </header>
  );
}
