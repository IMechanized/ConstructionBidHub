import { useQuery } from "@tanstack/react-query";
import { Rfi, Rfp } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";
import { useLocation } from "wouter";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { format } from "date-fns";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function RfiPage() {
  const [location] = useLocation();
  
  const { data: rfis, isLoading } = useQuery<(Rfi & { rfp: Rfp | null })[]>({
    queryKey: ["/api/rfis"],
  });

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <div className="hidden md:block">
            <DashboardSidebar currentPath={location} />
          </div>

          <main className="flex-1 min-h-screen">
            <div className="container mx-auto px-4 py-6 md:py-8 pb-20 md:pb-8">
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">RFIs</h1>
                {isLoading ? (
                  <DashboardSectionSkeleton count={6} />
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {rfis?.map((rfi) => (
                      <div key={rfi.id} className="bg-card rounded-lg border p-6">
                        <h3 className="font-semibold mb-4">{rfi.rfp?.title || "Unknown RFP"}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {rfi.message}
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Status:</span>
                            <span className="capitalize">{rfi.status}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">Submitted:</span>
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

        <MobileDashboardNav
          userType="contractor"
          currentPath={location}
        />
      </div>
    </SidebarProvider>
  );
}
