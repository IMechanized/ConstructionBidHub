import { useQuery } from "@tanstack/react-query";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FileBarChart } from "lucide-react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ReportsPage() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
    },
  ];

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <DashboardSidebar currentPath={location} />

          <main className="flex-1 min-h-screen w-full">
            <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
              <BreadcrumbNav items={breadcrumbItems} />
              <h1 className="text-3xl font-bold mb-8">Reports</h1>
              <div className="bg-card rounded-lg border shadow-sm p-12">
                <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                  <FileBarChart className="h-16 w-16 mb-6 text-primary" />
                  <p className="text-lg font-medium mb-2">Reports Coming Soon</p>
                  <p className="text-sm text-center max-w-md">
                    We're working on comprehensive reporting features to help you track and analyze your bidding activities.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}