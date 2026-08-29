import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-muted/30 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-6 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <Button asChild>
        <Link href="/documents">Back to Documents</Link>
      </Button>
    </div>
  );
}
