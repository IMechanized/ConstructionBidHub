import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RfpsExpiringSoonWidget, 
  UnreadRfisWidget, 
  ResponseRateWidget, 
  ActiveRfpsWidget 
} from "@/components/dashboard-stat-widgets";
import { CalendarWidget } from "@/components/calendar-widget";

export default function Dashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);

  const breadcrumbItems = [
    {
      label: t('dashboard.dashboard'),
      href: "/dashboard",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />

            <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Welcome back, {user?.companyName}</h2>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">Here's your dashboard overview</p>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">RFPs Expiring Soon</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <RfpsExpiringSoonWidget />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Unread RFIs</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <UnreadRfisWidget />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Response Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponseRateWidget />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Active RFPs</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ActiveRfpsWidget />
                  </CardContent>
                </Card>
              </div>

              {/* Calendar Widget */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CalendarWidget />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
