import { useEffect, useState } from "react";
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
  ActiveRfpsWidget,
} from "@/components/dashboard-stat-widgets";
import { CalendarWidget } from "@/components/calendar-widget";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle, Search } from "lucide-react";
import RfpForm from "@/components/rfp-form";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    toast({
      title: "RFP created",
      description: "Your RFP has been posted successfully.",
    });
  };

  const breadcrumbItems = [
    { label: t('dashboard.dashboard'), href: "/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6 md:py-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />

            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Welcome back, {user?.companyName}
                </h1>
                <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
                  Here's what's happening with your bids today.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  size="sm"
                  className="gap-1.5"
                  data-testid="button-post-rfp"
                >
                  <PlusCircle className="h-4 w-4" />
                  Post RFP
                </Button>
                <Button
                  onClick={() => setLocation('/dashboard/all')}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  data-testid="button-search-rfps"
                >
                  <Search className="h-4 w-4" />
                  Browse RFPs
                </Button>
              </div>
            </div>

            {/* Stat widgets grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2 pt-5 px-5">
                  <CardTitle className="text-[0.9375rem] font-semibold">Closing this week</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <RfpsExpiringSoonWidget />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-5 px-5">
                  <CardTitle className="text-[0.9375rem] font-semibold">Pending inquiries</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <UnreadRfisWidget />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-5 px-5">
                  <CardTitle className="text-[0.9375rem] font-semibold">Response rate</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <ResponseRateWidget />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-5 px-5">
                  <CardTitle className="text-[0.9375rem] font-semibold">Open opportunities</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <ActiveRfpsWidget />
                </CardContent>
              </Card>
            </div>

            {/* Calendar */}
            <Card>
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-[0.9375rem] font-semibold">Deadline calendar</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <CalendarWidget />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Create RFP Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] sm:w-full mx-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('dashboard.createNewRfp')}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-2 max-h-[70vh] pb-4">
            <RfpForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateModalOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
