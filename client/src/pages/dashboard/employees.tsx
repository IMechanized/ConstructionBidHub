import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";
import { useLocation } from "wouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import EmployeeManagement from "@/components/employee-management";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";

export default function EmployeesPage() {
  const [location] = useLocation();
  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Employees",
      href: "/dashboard/employees",
    },
  ];

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <div className="hidden md:block flex-shrink-0">
            <DashboardSidebar currentPath={location} />
          </div>

          <main className="flex-1 min-h-screen w-full">
            <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl xl:max-w-[110rem]">
              <BreadcrumbNav items={breadcrumbItems} />
              <h1 className="text-3xl font-bold mb-8">Employee Management</h1>
              <div className="bg-card rounded-lg border shadow-sm p-6">
                <EmployeeManagement />
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