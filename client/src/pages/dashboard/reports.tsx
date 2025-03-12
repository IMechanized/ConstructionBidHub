import { useQuery } from "@tanstack/react-query";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { FileBarChart } from "lucide-react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <BreadcrumbNav items={breadcrumbItems} />
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="open">Open RFPs</SelectItem>
                <SelectItem value="closed">Closed RFPs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Card className="p-2">
              <h3 className="text-xs font-semibold mb-1 px-1">RFPs by Month</h3>
              <div className="h-[180px]">
                <ChartContainer config={{}}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--primary)" />
                  </BarChart>
                </ChartContainer>
              </div>
            </Card>

            <Card className="p-2">
              <h3 className="text-xs font-semibold mb-1 px-1">RFPs by Status</h3>
              <div className="h-[180px]">
                <ChartContainer config={{}}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--primary)" />
                  </BarChart>
                </ChartContainer>
              </div>
            </Card>
          </div>

          <Card className="p-2">
            <h2 className="text-xs font-semibold mb-2 px-1">RFP Reports</h2>
            {rfps && rfps.length > 0 ? (
              <RfpReport rfps={rfps} />
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <FileBarChart className="h-6 w-6 mb-2 text-primary" />
                <p className="text-xs font-medium mb-1">No Reports Available</p>
                <p className="text-xs text-center max-w-md">
                  There are currently no RFPs in the system.
                </p>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}