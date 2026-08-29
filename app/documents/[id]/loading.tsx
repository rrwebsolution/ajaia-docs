import { Skeleton } from "@/components/ui/skeleton";

export default function EditorLoading() {
  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/95">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="ml-auto h-8 w-20 rounded-md" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-4 h-11 w-full max-w-md rounded-lg" />
        <div className="rounded-xl border bg-card p-10 shadow-sm">
          <Skeleton className="mb-4 h-6 w-2/3" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-5/6" />
          <Skeleton className="mb-6 h-4 w-3/4" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </main>
    </div>
  );
}
