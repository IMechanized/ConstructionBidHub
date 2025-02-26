import { useQuery } from "@tanstack/react-query";
import { RfpAnalytics, Rfp } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AnalyticsDashboard() {
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

  const chartData = analytics?.map(item => ({
    name: item.rfp.title.substring(0, 20) + "...",
    views: item.totalViews,
    uniqueViews: item.uniqueViews,
    bids: item.totalBids,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Boosted RFPs Analytics</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.reduce((sum, item) => sum + item.totalViews, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unique Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.reduce((sum, item) => sum + item.uniqueViews, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average View Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (analytics?.reduce((sum, item) => sum + item.averageViewTime, 0) || 0) /
                  (analytics?.length || 1)
              )}s
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.reduce((sum, item) => sum + item.totalBids, 0)}
            </div>
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
                  <Bar dataKey="views" fill="#8884d8" name="Total Views" />
                  <Bar dataKey="uniqueViews" fill="#82ca9d" name="Unique Views" />
                  <Bar dataKey="bids" fill="#ffc658" name="Bids" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RFP Title</TableHead>
                <TableHead>Total Views</TableHead>
                <TableHead>Unique Views</TableHead>
                <TableHead>Avg. View Time</TableHead>
                <TableHead>Total Bids</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.rfp.title}</TableCell>
                  <TableCell>{item.totalViews}</TableCell>
                  <TableCell>{item.uniqueViews}</TableCell>
                  <TableCell>{item.averageViewTime}s</TableCell>
                  <TableCell>{item.totalBids}</TableCell>
                  <TableCell>{item.clickThroughRate}%</TableCell>
                  <TableCell>
                    {format(new Date(item.date), 'MMM dd, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
