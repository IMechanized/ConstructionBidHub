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
          <div className="hidden md:block">
            <DashboardSidebar currentPath={location} />
          </div>

          <main className="flex-1 min-h-screen">
            <div className="container mx-auto px-4 py-6 md:py-8 pb-20 md:pb-8">
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">Reports</h1>
                <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
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
