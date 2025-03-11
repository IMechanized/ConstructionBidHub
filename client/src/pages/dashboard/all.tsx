import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { RfpCard } from "@/components/rfp-card";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { isAfter, subHours } from "date-fns";

export default function AllRfps() {
  const [location] = useLocation();

  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const availableRfps = rfps || [];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <main className="md:ml-[280px] min-h-screen">
        <div className="container mx-auto px-4 py-6 md:py-8 mt-14 md:mt-0">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">All RFPs</h1>
            {isLoading ? (
              <DashboardSectionSkeleton count={6} />
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {availableRfps.map((rfp) => (
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
  );
}