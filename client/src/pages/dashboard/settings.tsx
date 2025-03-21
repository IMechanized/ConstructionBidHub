import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import SettingsForm from "@/components/settings-form";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const [location] = useLocation();
  const { t } = useTranslation();
  
  const breadcrumbItems = [
    {
      label: t('dashboard.dashboard'),
      href: "/dashboard",
    },
    {
      label: t('sidebar.settings'),
      href: "/dashboard/settings",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />
            <h1 className="text-3xl font-bold mb-8">{t('settings.organizationSettings')}</h1>
            
            {/* Organization settings form with all fields including language preference */}
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <SettingsForm />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}