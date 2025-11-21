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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { format } from "date-fns";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight, ExternalLink, RefreshCcw, Download, GitCompare, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AnalyticsDashboard() {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRfpIds, setSelectedRfpIds] = useState<number[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [drillDownRfp, setDrillDownRfp] = useState<(RfpAnalytics & { rfp: Rfp }) | null>(null);
  
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

  // Function to export analytics data to CSV
  const handleExportCSV = () => {
    if (!analytics || analytics.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no analytics to export",
        variant: "destructive"
      });
      return;
    }

    const exportData = analytics.map(item => ({
      rfpTitle: item.rfp.title,
      totalViews: item.totalViews || 0,
      uniqueViews: item.uniqueViews || 0,
      averageViewTime: item.averageViewTime || 0,
      totalBids: item.totalBids || 0,
      clickThroughRate: item.clickThroughRate || 0,
      rfpCreated: format(new Date(item.rfp.createdAt), 'yyyy-MM-dd'),
      dataDate: format(new Date(item.date), 'yyyy-MM-dd'),
      status: item.rfp.status,
      location: `${item.rfp.jobCity}, ${item.rfp.jobState}`,
    }));

    const columns = {
      rfpTitle: 'RFP Title',
      totalViews: 'Total Views',
      uniqueViews: 'Unique Views',
      averageViewTime: 'Avg. View Time (seconds)',
      totalBids: 'Total Bids',
      clickThroughRate: 'Click-Through Rate (%)',
      rfpCreated: 'RFP Created Date',
      dataDate: 'Analytics Date',
      status: 'Status',
      location: 'Location',
    };

    const filename = `analytics-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    
    exportToCSV(exportData, filename, columns);
    
    toast({
      title: "Export Successful",
      description: `Downloaded ${analytics.length} analytics records`,
    });
  };

  // Toggle RFP selection for comparison
  const toggleRfpSelection = (rfpId: number) => {
    setSelectedRfpIds(prev => {
      if (prev.includes(rfpId)) {
        return prev.filter(id => id !== rfpId);
      } else {
        if (prev.length >= 5) {
          toast({
            title: "Maximum Reached",
            description: "You can compare up to 5 RFPs at a time",
            variant: "destructive"
          });
          return prev;
        }
        return [...prev, rfpId];
      }
    });
  };

  // Get selected RFPs data for comparison
  const selectedRfpsData = analytics?.filter(item => 
    selectedRfpIds.includes(item.rfp.id)
  ) || [];

  // Prepare comparison data
  const comparisonData = selectedRfpsData.map(item => ({
    name: item.rfp.title.substring(0, 15) + "...",
    fullName: item.rfp.title,
    views: item.totalViews || 0,
    uniqueViews: item.uniqueViews || 0,
    avgTime: item.averageViewTime || 0,
    bids: item.totalBids || 0,
    ctr: item.clickThroughRate || 0,
  }));

  // Radar chart data
  const radarData = [{
    metric: 'Views',
    ...Object.fromEntries(selectedRfpsData.map((item, idx) => [
      `rfp${idx}`,
      (item.totalViews || 0) / 10 // Normalize to 0-100 scale
    ]))
  }, {
    metric: 'Unique',
    ...Object.fromEntries(selectedRfpsData.map((item, idx) => [
      `rfp${idx}`,
      (item.uniqueViews || 0) / 10
    ]))
  }, {
    metric: 'Avg Time',
    ...Object.fromEntries(selectedRfpsData.map((item, idx) => [
      `rfp${idx}`,
      (item.averageViewTime || 0) / 5
    ]))
  }, {
    metric: 'Bids',
    ...Object.fromEntries(selectedRfpsData.map((item, idx) => [
      `rfp${idx}`,
      (item.totalBids || 0) * 20
    ]))
  }, {
    metric: 'CTR',
    ...Object.fromEntries(selectedRfpsData.map((item, idx) => [
      `rfp${idx}`,
      item.clickThroughRate || 0
    ]))
  }];
  
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

  // Handle case when there are no analytics to display
  if ((!analytics || analytics.length === 0) && !isLoading) {
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
    rfpId: item.rfp.id,
  })) || [];

  // Handle chart bar click for drill-down
  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const rfpId = data.activePayload[0].payload.rfpId;
      const selectedRfpData = analytics?.find(item => item.rfp.id === rfpId);
      if (selectedRfpData) {
        setDrillDownRfp(selectedRfpData);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Boosted RFPs Analytics</h1>
                <p className="text-muted-foreground">
                  View performance metrics for your featured RFPs. These analytics help you understand engagement and optimize your RFP visibility. 
                  <strong> Only boosted RFPs you own are shown here.</strong>
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedRfpIds.length > 0 && (
                  <Button 
                    onClick={() => setShowComparisonModal(true)}
                    className="flex items-center gap-2"
                    data-testid="compare-rfps-button"
                  >
                    <GitCompare className="h-4 w-4" />
                    Compare ({selectedRfpIds.length})
                  </Button>
                )}
                <Button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2"
                  variant="outline"
                  data-testid="export-csv-button"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button 
                  onClick={refreshAnalytics} 
                  disabled={isRefreshing} 
                  className="flex items-center gap-2"
                  variant="outline"
                  data-testid="refresh-analytics-button"
                >
                  <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
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
                  <p className="text-sm text-muted-foreground mt-1">
                    Click on any bar to see detailed information
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} onClick={handleChartClick}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip cursor={{ fill: 'rgba(136, 132, 216, 0.1)' }} />
                        <Bar 
                          dataKey="views" 
                          fill={theme === 'dark' ? "#8884d8" : "#8884d8"} 
                          name="Total Views"
                          cursor="pointer"
                        />
                        <Bar 
                          dataKey="uniqueViews" 
                          fill={theme === 'dark' ? "#82ca9d" : "#82ca9d"} 
                          name="Unique Views"
                          cursor="pointer"
                        />
                        <Bar 
                          dataKey="bids" 
                          fill={theme === 'dark' ? "#ffc658" : "#ffc658"} 
                          name="Bids"
                          cursor="pointer"
                        />
                        <Bar 
                          dataKey="ctr" 
                          fill={theme === 'dark' ? "#ff8042" : "#ff8042"} 
                          name="CTR (%)"
                          cursor="pointer"
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
                          <TableHead className="w-[50px]">
                            <span className="sr-only">Select</span>
                          </TableHead>
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
                            <TableCell>
                              <Checkbox
                                checked={selectedRfpIds.includes(item.rfp.id)}
                                onCheckedChange={() => toggleRfpSelection(item.rfp.id)}
                                data-testid={`select-rfp-${item.rfp.id}`}
                              />
                            </TableCell>
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
                                  setLocation(`/rfp/${item.rfp.id}?from=dashboard-analytics`);
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

            <Dialog open={!!drillDownRfp} onOpenChange={() => setDrillDownRfp(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Detailed Analytics</DialogTitle>
                  <DialogDescription>
                    {drillDownRfp?.rfp.title}
                  </DialogDescription>
                </DialogHeader>

                {drillDownRfp && (
                  <div className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Views</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{drillDownRfp.totalViews || 0}</div>
                          <p className="text-xs text-muted-foreground mt-1">All page visits</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Unique Visitors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{drillDownRfp.uniqueViews || 0}</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(drillDownRfp.totalViews || 0) > 0 
                              ? `${Math.round(((drillDownRfp.uniqueViews || 0) / (drillDownRfp.totalViews || 1)) * 100)}% of total views`
                              : 'No views yet'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Avg. View Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{drillDownRfp.averageViewTime || 0}s</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(drillDownRfp.averageViewTime || 0) > 60 ? 'Strong engagement' : 'Normal engagement'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Bids</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{drillDownRfp.totalBids || 0}</div>
                          <p className="text-xs text-muted-foreground mt-1">Bid submissions</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Click-Through Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{drillDownRfp.clickThroughRate || 0}%</div>
                          <p className="text-xs text-muted-foreground mt-1">Views to bids conversion</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold capitalize">{drillDownRfp.rfp.status}</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created {format(new Date(drillDownRfp.rfp.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">RFP Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Location:</span>{' '}
                            {drillDownRfp.rfp.jobCity}, {drillDownRfp.rfp.jobState}
                          </div>
                          <div>
                            <span className="font-medium">Deadline:</span>{' '}
                            {format(new Date(drillDownRfp.rfp.deadline), 'MMM dd, yyyy')}
                          </div>
                          {drillDownRfp.rfp.budgetMin && (
                            <div>
                              <span className="font-medium">Budget:</span>{' '}
                              ${drillDownRfp.rfp.budgetMin.toLocaleString()}+
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Featured:</span>{' '}
                            {drillDownRfp.rfp.featured ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button 
                            onClick={() => {
                              setDrillDownRfp(null);
                              setLocation(`/rfp/${drillDownRfp.rfp.id}?from=dashboard-analytics`);
                            }}
                            className="w-full"
                          >
                            View Full RFP
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Performance Insights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {(drillDownRfp.totalViews || 0) > 50 && (
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                              <span>High visibility - Your RFP is getting good exposure</span>
                            </div>
                          )}
                          {(drillDownRfp.clickThroughRate || 0) > 5 && (
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                              <span>Strong conversion rate - Contractors are interested</span>
                            </div>
                          )}
                          {(drillDownRfp.averageViewTime || 0) > 120 && (
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                              <span>High engagement - Visitors are reading your RFP thoroughly</span>
                            </div>
                          )}
                          {(drillDownRfp.totalViews || 0) < 10 && (drillDownRfp.totalBids || 0) === 0 && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                              <span>Low visibility - Consider boosting this RFP for more exposure</span>
                            </div>
                          )}
                          {(drillDownRfp.totalViews || 0) > 20 && (drillDownRfp.totalBids || 0) === 0 && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                              <span>Views but no bids - Consider reviewing your requirements or budget</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>RFP Performance Comparison</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRfpIds([])}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear Selection
                    </Button>
                  </DialogTitle>
                  <DialogDescription>
                    Comparing {selectedRfpIds.length} RFPs side by side
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Views Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="views" fill="#8884d8" name="Total Views" />
                              <Bar dataKey="uniqueViews" fill="#82ca9d" name="Unique Views" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Engagement Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="avgTime" fill="#ffc658" name="Avg Time (s)" />
                              <Bar dataKey="bids" fill="#ff8042" name="Bids" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedRfpsData.length >= 2 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Overall Performance Radar</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[400px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="metric" />
                              <PolarRadiusAxis />
                              <Tooltip />
                              <Legend />
                              {selectedRfpsData.map((item, idx) => (
                                <Radar
                                  key={idx}
                                  name={item.rfp.title.substring(0, 20)}
                                  dataKey={`rfp${idx}`}
                                  stroke={['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'][idx]}
                                  fill={['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'][idx]}
                                  fillOpacity={0.3}
                                />
                              ))}
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detailed Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>RFP Title</TableHead>
                            <TableHead className="text-right">Views</TableHead>
                            <TableHead className="text-right">Unique</TableHead>
                            <TableHead className="text-right">Avg Time</TableHead>
                            <TableHead className="text-right">Bids</TableHead>
                            <TableHead className="text-right">CTR (%)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedRfpsData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.rfp.title}</TableCell>
                              <TableCell className="text-right">{item.totalViews || 0}</TableCell>
                              <TableCell className="text-right">{item.uniqueViews || 0}</TableCell>
                              <TableCell className="text-right">{item.averageViewTime || 0}s</TableCell>
                              <TableCell className="text-right">{item.totalBids || 0}</TableCell>
                              <TableCell className="text-right">{item.clickThroughRate || 0}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}