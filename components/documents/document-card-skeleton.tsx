import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentCardSkeleton() {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-6">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-1/3" />
      </CardContent>
    </Card>
  );
}

export function DocumentGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  );
}
