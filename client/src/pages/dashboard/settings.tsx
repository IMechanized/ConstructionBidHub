import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";
import { useLocation } from "wouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import SettingsForm from "@/components/settings-form";

export default function SettingsPage() {
  const [location] = useLocation();

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <div className="hidden md:block flex-shrink-0">
            <DashboardSidebar currentPath={location} />
          </div>

          <main className="flex-1 min-h-screen w-full">
            <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">Settings</h1>
                <SettingsForm />
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