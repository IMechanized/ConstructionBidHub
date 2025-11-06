import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useTranslation } from "react-i18next";
import { DashboardWidgets, Widget } from "@/components/dashboard-widgets";
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

  const widgets: Widget[] = useMemo(() => [
    {
      id: "rfps-expiring",
      title: "RFPs Expiring Soon",
      component: <RfpsExpiringSoonWidget />,
      defaultSize: { w: 3, h: 3 },
      minSize: { w: 2, h: 2 },
    },
    {
      id: "unread-rfis",
      title: "Unread RFIs",
      component: <UnreadRfisWidget />,
      defaultSize: { w: 3, h: 3 },
      minSize: { w: 2, h: 2 },
    },
    {
      id: "response-rate",
      title: "Response Rate",
      component: <ResponseRateWidget />,
      defaultSize: { w: 3, h: 3 },
      minSize: { w: 2, h: 2 },
    },
    {
      id: "active-rfps",
      title: "Active RFPs",
      component: <ActiveRfpsWidget />,
      defaultSize: { w: 3, h: 3 },
      minSize: { w: 2, h: 2 },
    },
    {
      id: "calendar",
      title: "Upcoming Deadlines",
      component: <CalendarWidget />,
      defaultSize: { w: 6, h: 6 },
      minSize: { w: 4, h: 4 },
    },
  ], []);

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

              <DashboardWidgets widgets={widgets} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
