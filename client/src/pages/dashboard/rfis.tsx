import { useQuery } from "@tanstack/react-query";
import { Rfi, Rfp } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { format } from "date-fns";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";

export default function RfiPage() {
  const [location] = useLocation();
  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "RFIs",
      href: "/dashboard/rfis",
    },
  ];

  const { data: rfis, isLoading, error } = useQuery<(Rfi & { rfp: Rfp | null })[]>({
    queryKey: ["/api/rfis"],
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <main className="md:ml-[280px] min-h-screen w-full">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
          <BreadcrumbNav items={breadcrumbItems} />

          <div className="space-y-6 mt-6">
            <h1 className="text-2xl font-bold">Request for Information</h1>

            {isLoading ? (
              <DashboardSectionSkeleton count={6} data-testid="dashboard-section-skeleton" />
            ) : error ? (
              <div className="text-destructive">Error loading RFIs. Please try again later.</div>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {rfis?.map((rfi) => (
                  <div key={rfi.id} className="bg-card rounded-lg border p-6 shadow-sm">
                    <h3 className="text-xl font-semibold mb-4">{rfi.rfp?.title || "Unknown RFP"}</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {rfi.message}
                    </p>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Status</span>
                        <span className="capitalize px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {rfi.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Submitted</span>
                        <span>{format(new Date(rfi.createdAt), "PPp")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}