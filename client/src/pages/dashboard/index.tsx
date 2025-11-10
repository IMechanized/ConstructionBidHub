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
          <div className="container mx-auto p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />

            <div className="space-y-6 mt-6">
              <div>
                <h2 className="text-3xl font-bold">Welcome back, {user?.companyName}</h2>
                <p className="text-muted-foreground mt-1">Here's your dashboard overview</p>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>RFPs Expiring Soon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RfpsExpiringSoonWidget />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Unread RFIs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UnreadRfisWidget />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Response Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponseRateWidget />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active RFPs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActiveRfpsWidget />
                  </CardContent>
                </Card>
              </div>

              {/* Calendar Widget */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
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
