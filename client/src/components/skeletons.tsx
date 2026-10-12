import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ─── RFP Card Skeleton ─────────────────────────────────────── */
export function RfpCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Client name */}
      <Skeleton className="h-3.5 w-28" />
      {/* Title */}
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      {/* Map */}
      <Skeleton className="h-24 w-full rounded-md" />
      {/* Metadata rows */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      </div>
    </div>
  );
}

/* ─── Bid Card Skeleton ─────────────────────────────────────── */
export function BidCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

/* ─── Employee Card Skeleton ────────────────────────────────── */
export function EmployeeCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3.5 w-24" />
      </div>
    </div>
  );
}

/* ─── Dashboard Section Skeleton (grid of card skeletons) ───── */
export function DashboardSectionSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <RfpCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ─── RFP Detail Skeleton ───────────────────────────────────── */
export function RfpDetailSkeleton() {
  return (
    <div className="container px-3 sm:px-4 py-4 sm:py-8">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Dates block */}
        <div className="flex justify-end">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-36" />
          </div>
        </div>

        <Skeleton className="h-px w-full" />

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-48" />
        </div>

        <Skeleton className="h-px w-full" />

        {/* Description */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        <Skeleton className="h-px w-full" />

        {/* Details grid */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        <Skeleton className="h-px w-full" />

        {/* Map */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-48 sm:h-64 w-full rounded-lg" />
        </div>

        <Skeleton className="h-px w-full" />

        {/* CTA */}
        <div className="flex justify-center pt-4">
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>
  );
}

/* ─── Report Detail Skeleton ────────────────────────────────── */
export function ReportDetailSkeleton() {
  return (
    <div className="container px-4 py-8 space-y-6">
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
        <div className="space-y-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── PDF Loading Skeleton ──────────────────────────────────── */
export function PdfLoadingSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-center">
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-lg" />
      <div className="flex justify-center gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

/* ─── Notification Preferences Skeleton ─────────────────────── */
export function NotificationPreferencesSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Section header */}
      <div className="px-6 py-5 border-b space-y-1.5">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Toggle rows */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="px-6 py-5 flex items-center justify-between border-b"
        >
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-56" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      ))}
      {/* Notification types section */}
      <div className="px-6 py-5 border-b space-y-4">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        ))}
      </div>
      {/* Quiet hours section */}
      <div className="px-6 py-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}
