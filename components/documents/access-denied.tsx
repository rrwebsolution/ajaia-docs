import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-muted/30 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <Lock className="size-6 text-destructive" />
      </div>
      <div>
        <h1 className="text-lg font-semibold">Access denied</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          You don&apos;t have access to this document.
        </p>
      </div>
      <Button asChild>
        <Link href="/documents">Back to Documents</Link>
      </Button>
    </div>
  );
}
