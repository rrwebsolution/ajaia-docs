import { Skeleton } from "@/components/ui/skeleton";
import { DocumentGridSkeleton } from "@/components/documents/document-card-skeleton";

export default function DocumentsLoading() {
  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/95">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="ml-auto h-9 flex-1 max-w-md" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Skeleton className="mb-6 h-9 w-64 rounded-lg" />
        <DocumentGridSkeleton />
      </main>
    </div>
  );
}
