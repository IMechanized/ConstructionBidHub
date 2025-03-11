import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
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
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />
            <h1 className="text-3xl font-bold mb-8">Employee Management</h1>
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <EmployeeManagement />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}