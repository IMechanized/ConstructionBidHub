import { useQuery } from "@tanstack/react-query";
import { Rfi, Rfp } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { format } from "date-fns";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export default function RfiPage() {
  const [location] = useLocation();
  const { toast } = useToast();

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "My RFIs",
      href: "/dashboard/rfis",
    },
  ];

  const { data: rfis, isLoading, error } = useQuery<(Rfi & { rfp: Rfp | null })[]>({
    queryKey: ["/api/rfis"],
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: "Failed to load your RFIs. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <main className="md:ml-[280px] min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl mt-20 md:mt-0">
          <BreadcrumbNav items={breadcrumbItems} />

          <div className="space-y-6 mt-4">
            <h1 className="text-2xl font-bold">My RFIs</h1>

            {isLoading ? (
              <DashboardSectionSkeleton count={5} />
            ) : error ? (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
                Error loading RFIs. Please try again later.
              </div>
            ) : !rfis?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                You haven't submitted any RFIs yet.
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RFP Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Submitted Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfis.map((rfi) => (
                      <TableRow key={rfi.id}>
                        <TableCell className="font-medium">
                          {rfi.rfp?.title || "Unknown RFP"}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="truncate">{rfi.message}</p>
                        </TableCell>
                        <TableCell>
                          {format(new Date(rfi.createdAt), "PPp")}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                            {rfi.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}