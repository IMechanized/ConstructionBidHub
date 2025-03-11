import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";
import { useLocation } from "wouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import EmployeeManagement from "@/components/employee-management";

export default function EmployeesPage() {
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
                <h1 className="text-2xl font-bold">Employees</h1>
                <div className="bg-card rounded-lg border p-6">
                  <EmployeeManagement />
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