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

      <main className="md:ml-[280px] min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl mt-20 md:mt-0">
          <BreadcrumbNav items={breadcrumbItems} />

          <div className="space-y-6 mt-4">
            <h1 className="text-2xl font-bold">Request for Information</h1>

            {isLoading ? (
              <DashboardSectionSkeleton count={6} data-testid="dashboard-section-skeleton" />
            ) : error ? (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
                Error loading RFIs. Please try again later.
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rfis?.map((rfi) => (
                  <div 
                    key={rfi.id} 
                    className="bg-card rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold mb-3 line-clamp-2">
                      {rfi.rfp?.title || "Unknown RFP"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {rfi.message}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Status</span>
                        <span className="capitalize px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                          {rfi.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Submitted</span>
                        <span className="text-xs">{format(new Date(rfi.createdAt), "PPp")}</span>
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