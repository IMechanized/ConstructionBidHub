import { useQuery } from "@tanstack/react-query";
import { RfpAnalytics, Rfp } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function AnalyticsDashboard() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
    },
  ];

  const { data: analytics, isLoading } = useQuery<(RfpAnalytics & { rfp: Rfp })[]>({
    queryKey: ["/api/analytics/boosted"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  const totalItems = analytics?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Calculate pagination indices
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  // Get current page data
  const currentData = analytics?.slice(startIndex, endIndex) || [];

  const chartData = analytics?.map(item => ({
    name: item.rfp.title.substring(0, 20) + "...",
    views: item.totalViews || 0,
    uniqueViews: item.uniqueViews || 0,
    bids: item.totalBids || 0,
    ctr: item.clickThroughRate || 0,
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />
            <h1 className="text-3xl font-bold mb-8">Boosted RFPs Analytics</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics?.reduce((sum, item) => sum + (item.totalViews || 0), 0)}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Across all featured RFPs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Unique Visitors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics?.reduce((sum, item) => sum + (item.uniqueViews || 0), 0)}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Individual users viewing your RFPs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Average View Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.round(
                      (analytics?.reduce((sum, item) => sum + (item.averageViewTime || 0), 0) || 0) /
                        (analytics?.length || 1)
                    )}s
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Average time spent viewing each RFP
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Total Bids</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics?.reduce((sum, item) => sum + (item.totalBids || 0), 0)}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Bid submissions across all RFPs
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar 
                          dataKey="views" 
                          fill={theme === 'dark' ? "#8884d8" : "#8884d8"} 
                          name="Total Views" 
                        />
                        <Bar 
                          dataKey="uniqueViews" 
                          fill={theme === 'dark' ? "#82ca9d" : "#82ca9d"} 
                          name="Unique Views" 
                        />
                        <Bar 
                          dataKey="bids" 
                          fill={theme === 'dark' ? "#ffc658" : "#ffc658"} 
                          name="Bids" 
                        />
                        <Bar 
                          dataKey="ctr" 
                          fill={theme === 'dark' ? "#ff8042" : "#ff8042"} 
                          name="CTR (%)" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Detailed Analytics</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{endIndex} of {totalItems} RFPs
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RFP Title</TableHead>
                      <TableHead className="text-center">Total Views</TableHead>
                      <TableHead className="text-center">Unique Views</TableHead>
                      <TableHead className="text-center">Avg. View Time</TableHead>
                      <TableHead className="text-center">Total Bids</TableHead>
                      <TableHead className="text-center">CTR</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.rfp.title}</TableCell>
                        <TableCell className="text-center">{item.totalViews || 0}</TableCell>
                        <TableCell className="text-center">{item.uniqueViews || 0}</TableCell>
                        <TableCell className="text-center">{item.averageViewTime || 0}s</TableCell>
                        <TableCell className="text-center">{item.totalBids || 0}</TableCell>
                        <TableCell className="text-center">{item.clickThroughRate || 0}%</TableCell>
                        <TableCell>
                          {format(new Date(item.date), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          />
                        </PaginationItem>
                        <PaginationItem className="flex items-center mx-2">
                          <span>
                            Page {currentPage} of {totalPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}