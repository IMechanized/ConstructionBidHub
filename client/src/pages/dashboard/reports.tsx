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

  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

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

  const chartData = rfps?.reduce((acc: any[], rfp) => {
    const month = new Date(rfp.deadline).toLocaleString('default', { month: 'short' });
    const existingMonth = acc.find(item => item.month === month);
    if (existingMonth) {
      existingMonth.count += 1;
    } else {
      acc.push({ month, count: 1 });
    }
    return acc;
  }, []) || [];

  const statusData = rfps?.reduce((acc: any[], rfp) => {
    const existingStatus = acc.find(item => item.status === rfp.status);
    if (existingStatus) {
      existingStatus.count += 1;
    } else {
      acc.push({ status: rfp.status, count: 1 });
    }
    return acc;
  }, []) || [];

  if (isLoading) {
    return <DashboardSectionSkeleton />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen">
          <div className="p-4 md:p-6 mt-14 md:mt-0 max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <BreadcrumbNav items={breadcrumbItems} />
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
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
                <div className="h-[250px]">
                  <ChartContainer config={{}}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--primary)" />
                    </BarChart>
                  </ChartContainer>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3">RFPs by Status</h3>
                <div className="h-[250px]">
                  <ChartContainer config={{}}>
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--primary)" />
                    </BarChart>
                  </ChartContainer>
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">RFP Reports</h2>
              {rfps && rfps.length > 0 ? (
                <RfpReport rfps={rfps} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileBarChart className="h-12 w-12 mb-4 text-primary" />
                  <p className="text-lg font-medium mb-2">No Reports Available</p>
                  <p className="text-sm text-center max-w-md">
                    There are currently no RFPs in the system. Create new RFPs to generate reports.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}