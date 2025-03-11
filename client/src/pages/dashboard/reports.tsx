import { useQuery } from "@tanstack/react-query";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";
import { useLocation } from "wouter";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FileBarChart } from "lucide-react";

export default function ReportsPage() {
  const [location] = useLocation();

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <div className="hidden md:block flex-shrink-0">
            <DashboardSidebar currentPath={location} />
          </div>

          <main className="flex-1 min-h-screen w-full">
            <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-6xl">
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">Reports</h1>
                <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground bg-card rounded-lg border p-8">
                  <FileBarChart className="h-12 w-12 mb-4" />
                  <p>Reports coming soon</p>
                </div>
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