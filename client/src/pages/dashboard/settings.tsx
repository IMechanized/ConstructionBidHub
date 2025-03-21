import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation, Link } from "wouter";
import SettingsForm from "@/components/settings-form";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

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
            
            {/* Language Settings Button */}
            <Card className="p-6 mb-6 border-2 border-primary">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Language Settings</h2>
                  <p className="text-muted-foreground mt-1">
                    Customize your application language preference
                  </p>
                </div>
                <Link href="/dashboard/language">
                  <Button className="w-full md:w-auto" size="lg">
                    <Globe className="mr-2 h-5 w-5" />
                    Change Language
                  </Button>
                </Link>
              </div>
            </Card>
            
            {/* Organization settings form with all fields */}
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <SettingsForm />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}