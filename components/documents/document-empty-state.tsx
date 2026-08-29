import { FileText, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentEmptyState({
  variant,
  onCreate,
}: {
  variant: "no-documents" | "no-shared" | "no-results";
  onCreate?: () => void;
}) {
  if (variant === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Search className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">No matching documents</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search term.
          </p>
        </div>
      </div>
    );
  }

  if (variant === "no-shared") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Users className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Nothing shared with you yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Documents another person shares with you will show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <FileText className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">No documents yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first document
        </p>
      </div>
      {onCreate && (
        <Button onClick={onCreate} size="sm" className="mt-1">
          New Document
        </Button>
      )}
    </div>
  );
}
