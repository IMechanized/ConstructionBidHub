import { Skeleton } from "@/components/ui/skeleton";

export function RfpCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-20" />
      <div className="flex justify-between gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export function BidCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-16" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function EmployeeCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function DashboardSectionSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 bg-card rounded-lg border">
          <RfpCardSkeleton />
        </div>
      ))}
    </div>
  );
}
