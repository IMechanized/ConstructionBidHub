import { useQuery } from "@tanstack/react-query";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { FileBarChart, ChevronDown } from "lucide-react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import RfpReport from "@/components/rfp-report";
import { Rfp } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  // Filter RFPs to only show those created by the current user
  const userRfps = rfps?.filter(rfp => rfp.organizationId === user?.id) || [];

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
    },
  ];

  const chartData = userRfps.reduce((acc: any[], rfp) => {
    const month = new Date(rfp.deadline).toLocaleString('default', { month: 'short' });
    const existingMonth = acc.find(item => item.month === month);
    if (existingMonth) {
      existingMonth.count += 1;
    } else {
      acc.push({ month, count: 1 });
    }
    return acc;
  }, []);

  const statusData = userRfps.reduce((acc: any[], rfp) => {
    const existingStatus = acc.find(item => item.status === rfp.status);
    if (existingStatus) {
      existingStatus.count += 1;
    } else {
      acc.push({ status: rfp.status, count: 1 });
    }
    return acc;
  }, []);

  if (isLoading) {
    return <DashboardSectionSkeleton />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-6 mt-14 md:mt-0 max-w-5xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <BreadcrumbNav items={breadcrumbItems} />
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="open">Open RFPs</SelectItem>
                  <SelectItem value="closed">Closed RFPs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">RFPs by Month</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">RFPs by Status</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">RFP Reports</h2>
              <div className="overflow-hidden">
                {userRfps.length > 0 ? (
                  <RfpReport rfps={userRfps} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <FileBarChart className="h-12 w-12 mb-4 text-primary" />
                    <p className="text-lg font-medium mb-2">No Reports Available</p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      You haven't created any RFPs yet. Create new RFPs to generate reports.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}