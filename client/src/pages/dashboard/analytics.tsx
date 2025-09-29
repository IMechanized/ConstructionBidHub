import { useQuery } from "@tanstack/react-query";
import { RfpAnalytics, Rfp } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
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
import { ChevronLeft, ChevronRight, ExternalLink, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AnalyticsDashboard() {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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

  // Make sure we have the user ID for analytics queries
  const userId = user?.id;

  // Use a timestamp to force fresh data and prevent caching issues
  const [timestamp, setTimestamp] = useState(() => Date.now());
  
  // Ensure we always get fresh data with no caching
  const { data: analytics, isLoading, error, refetch } = useQuery<(RfpAnalytics & { rfp: Rfp })[]>({
    queryKey: ["/api/analytics/boosted", userId, timestamp],
    enabled: !!userId, // Only run the query when we have a user ID
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Ensures data is always considered stale
    retry: 2,     // Retry failed requests a couple times
    refetchInterval: 60000, // Refresh data every minute for real-time updates
  });
  
  // Function to manually refresh analytics data
  const refreshAnalytics = async () => {
    if (!userId || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Update timestamp to force cache invalidation
      setTimestamp(Date.now());
      
      // Force invalidate the query cache
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/boosted"] });
      
      // Then refetch data
      await refetch();
      
      toast({
        title: "Analytics Refreshed",
        description: "Latest data has been loaded",
      });
    } catch (err) {
      console.error("Failed to refresh analytics:", err);
      toast({
        title: "Refresh Failed",
        description: "Could not load updated analytics",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Log analytics data for troubleshooting
  useEffect(() => {
    if (analytics) {
      console.log(`Analytics data loaded successfully: ${analytics.length} items`);
      if (analytics.length > 0) {
        console.log('Sample analytics item:', JSON.stringify(analytics[0]));
      }
    } else if (error) {
      console.error('Error loading analytics:', error);
    }
  }, [analytics, error]);
  
  // Force data reload after 1 second for debugging purposes
  useEffect(() => {
    if (!isLoading && analytics?.length === 0) {
      console.log("Detected empty analytics, scheduling reload...");
      const timer = setTimeout(() => {
        console.log("Performing forced analytics reload");
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/boosted"] });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, analytics?.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }
  
  // Handle case when there are no analytics to display
  if (!analytics || analytics.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar currentPath={location} />
        
        <div className="flex-1 md:ml-[280px]">
          <main className="w-full min-h-screen pb-16 md:pb-0">
            <div className="container mx-auto p-4 md:p-8 mt-14 md:mt-0">
              <BreadcrumbNav items={breadcrumbItems} />
              <h1 className="text-3xl font-bold mb-2">Boosted RFPs Analytics</h1>
              
              <div className="flex flex-col items-center justify-center p-8 mt-12 border rounded-lg border-dashed border-muted-foreground">
                <div className="text-center max-w-md">
                  <h3 className="text-xl font-semibold mb-2">No Boosted RFPs Found</h3>
                  <p className="text-muted-foreground mb-6">
                    You don't have any featured RFPs yet. Boosting your RFPs makes them more visible to contractors 
                    and provides detailed analytics on views and engagement.
                  </p>
                  <div className="space-y-4">
                    <Button onClick={() => setLocation('/dashboard')}>
                      Go to My RFPs
                    </Button>
                    <div className="text-sm text-muted-foreground pt-4">
                      <strong>How to get analytics:</strong>
                      <ol className="text-left mt-2 list-decimal pl-5 space-y-1">
                        <li>Create or edit an RFP</li>
                        <li>Check the "Featured" option</li>
                        <li>Analytics will appear here once your featured RFP receives views</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Boosted RFPs Analytics</h1>
                <p className="text-muted-foreground">
                  View performance metrics for your featured RFPs. These analytics help you understand engagement and optimize your RFP visibility. 
                  <strong> Only boosted RFPs you own are shown here.</strong>
                </p>
              </div>
              <Button 
                onClick={refreshAnalytics} 
                disabled={isRefreshing} 
                className="self-start flex items-center gap-2"
                variant="outline"
              >
                <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Analytics'}
              </Button>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-8 text-sm">
              <p className="text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Analytics data includes real-time tracking of views and engagement. 
                Data collection is ongoing and will become more accurate as users interact with your RFPs.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics?.reduce((sum, item) => sum + (item.totalViews || 0), 0)}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Total page views across all your boosted RFPs
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Note:</span> Owner views are not counted
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
                    Individual users viewing your boosted RFPs
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Each visitor is counted once per day
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Longer view times indicate higher engagement
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
                    Bid submissions across all boosted RFPs
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">CTR:</span> Measures bid submissions as % of views
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
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px] sm:w-[220px]">RFP Title</TableHead>
                          <TableHead className="text-center w-[80px] sm:w-[100px]">Views</TableHead>
                          <TableHead className="hidden md:table-cell text-center w-[100px]">Unique</TableHead>
                          <TableHead className="hidden lg:table-cell text-center w-[100px]">Avg. Time</TableHead>
                          <TableHead className="text-center w-[70px] sm:w-[80px]">Bids</TableHead>
                          <TableHead className="hidden lg:table-cell text-center w-[80px]">CTR</TableHead>
                          <TableHead className="hidden xl:table-cell w-[120px]">Created</TableHead>
                          <TableHead className="hidden xl:table-cell w-[120px]">Data From</TableHead>
                          <TableHead className="text-right w-[80px] sm:w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div className="truncate max-w-[180px] sm:max-w-[220px]">
                                {item.rfp.title}
                              </div>
                              {/* Show condensed info on mobile */}
                              <div className="md:hidden text-xs text-muted-foreground mt-1 space-y-1">
                                <div>Unique: {item.uniqueViews || 0} | Time: {item.averageViewTime || 0}s</div>
                                <div className="lg:hidden">CTR: {item.clickThroughRate || 0}%</div>
                                <div className="xl:hidden">
                                  Created: {format(new Date(item.rfp.createdAt), 'MMM dd')}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium">{item.totalViews || 0}</TableCell>
                            <TableCell className="hidden md:table-cell text-center">{item.uniqueViews || 0}</TableCell>
                            <TableCell className="hidden lg:table-cell text-center">{item.averageViewTime || 0}s</TableCell>
                            <TableCell className="text-center font-medium">{item.totalBids || 0}</TableCell>
                            <TableCell className="hidden lg:table-cell text-center">{item.clickThroughRate || 0}%</TableCell>
                            <TableCell className="hidden xl:table-cell">
                              {format(new Date(item.rfp.createdAt), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              {format(new Date(item.date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 px-2 sm:px-3"
                                onClick={() => {
                                  setLocation(`/rfp/${item.rfp.id}`);
                                  toast({
                                    title: "Viewing RFP",
                                    description: `Opening ${item.rfp.title}`,
                                  });
                                }}
                              >
                                <ExternalLink className="h-3.5 w-3.5 sm:mr-1" />
                                <span className="hidden sm:inline ml-1">View RFP</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent className="flex flex-wrap justify-center gap-1">
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="gap-1 pl-2.5 px-2 sm:px-3"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                          </Button>
                        </PaginationItem>
                        <PaginationItem className="flex items-center mx-2">
                          <span className="text-sm">
                            {currentPage}/{totalPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="gap-1 pr-2.5 px-2 sm:px-3"
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
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