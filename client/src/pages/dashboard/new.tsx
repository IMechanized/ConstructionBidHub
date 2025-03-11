import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { RfpCard } from "@/components/rfp-card";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { isAfter, subHours } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

export default function NewRfps() {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const twentyFourHoursAgo = subHours(new Date(), 24);
  const newRfps = rfps?.filter(rfp => 
    !rfp.featured && isAfter(new Date(rfp.createdAt), twentyFourHoursAgo)
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <main className="md:ml-[280px] min-h-screen pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6 md:py-8 mt-14 md:mt-0">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">New RFPs</h1>
            {isLoading ? (
              <DashboardSectionSkeleton count={6} />
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {newRfps.map((rfp) => (
                  <RfpCard
                    key={rfp.id}
                    rfp={rfp}
                    isNew={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}