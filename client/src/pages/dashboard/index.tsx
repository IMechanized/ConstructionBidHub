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
  ActiveRfpsWidget 
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

  useEffect(() => {
    if (user?.isAdmin && location === "/dashboard") {
      setLocation("/dashboard/admin");
    }
  }, [user?.isAdmin, location, setLocation]);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    toast({
      title: "Success",
      description: "RFP created successfully",
    });
  };

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

            {/* Navigation Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Button 
                onClick={() => setIsCreateModalOpen(true)} 
                className="gap-2"
                data-testid="button-post-rfp"
              >
                <PlusCircle className="h-4 w-4" />
                Post RFP
              </Button>
              <Button 
                onClick={() => setLocation('/dashboard/all')}
                variant="outline" 
                className="gap-2"
                data-testid="button-search-rfps"
              >
                <Search className="h-4 w-4" />
                Search RFPs
              </Button>
            </div>

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
