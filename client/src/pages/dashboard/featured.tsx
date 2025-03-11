import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";
import { useLocation } from "wouter";
import { RfpCard } from "@/components/rfp-card";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { isAfter, subHours } from "date-fns";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function FeaturedRfps() {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const featuredRfps = rfps?.filter(rfp => rfp.featured) || [];

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <div className="hidden md:block">
            <DashboardSidebar currentPath={location} />
          </div>

          <main className="flex-1 min-h-screen pb-16 md:pb-0">
            <div className="container mx-auto px-4 py-6 md:py-8">
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">Featured RFPs</h1>
                {isLoading ? (
                  <DashboardSectionSkeleton count={6} />
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {featuredRfps.map((rfp) => (
                      <RfpCard
                        key={rfp.id}
                        rfp={rfp}
                        isNew={isAfter(new Date(rfp.createdAt), subHours(new Date(), 24))}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        <MobileDashboardNav currentPath={location} />
      </div>
    </SidebarProvider>
  );
}