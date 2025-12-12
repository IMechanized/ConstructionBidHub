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

export function RfpDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <Skeleton className="h-5 w-48" />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8 text-right space-y-2">
            <Skeleton className="h-4 w-32 ml-auto" />
            <Skeleton className="h-4 w-36 ml-auto" />
            <Skeleton className="h-4 w-28 ml-auto" />
            <Skeleton className="h-4 w-32 ml-auto" />
          </div>

          <Skeleton className="h-px w-full my-4 sm:my-6" />

          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
          </div>

          <Skeleton className="h-px w-full my-4 sm:my-6" />

          <div className="mb-6 sm:mb-8 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>

          <Skeleton className="h-px w-full my-4 sm:my-6" />

          <div className="mb-6 sm:mb-8 space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>

          <Skeleton className="h-px w-full my-4 sm:my-6" />

          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>

          <div className="mt-8 flex gap-4">
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </main>
    </div>
  );
}

export function ReportDetailSkeleton() {
  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="space-y-8">
        <div className="bg-card rounded-lg border p-6">
          <Skeleton className="h-9 w-3/4 mb-6" />

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div>
              <Skeleton className="h-6 w-24 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          <div className="mb-6">
            <Skeleton className="h-6 w-44 mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>

          <div>
            <Skeleton className="h-6 w-44 mb-4" />
            <div className="overflow-x-auto">
              <div className="border rounded-lg">
                <div className="border-b p-3 bg-muted/50">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border-b last:border-b-0 p-3">
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PdfLoadingSkeleton() {
  return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-6 w-48 mx-auto" />
      <Skeleton className="h-[400px] w-full" />
      <div className="flex justify-center gap-2">
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
