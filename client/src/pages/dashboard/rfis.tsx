import { useQuery } from "@tanstack/react-query";
import { type Rfi, type Rfp } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation, useNavigate } from "wouter";
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
import { useEffect } from "react";

type RfiWithRfp = Rfi & { rfp: Rfp | null };

export default function RfiPage() {
  const [location, navigate] = useLocation();
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

  const { data: rfis = [], isLoading, error } = useQuery<RfiWithRfp[]>({
    queryKey: ["/api/rfis"],
    retry: 2,
    staleTime: 30000,
  });

  // Handle unauthorized access
  useEffect(() => {
    if (error instanceof Error && error.message.includes("401")) {
      navigate("/auth");
      toast({
        title: "Authentication Required",
        description: "Please sign in to view your RFIs",
        variant: "destructive",
      });
    }
  }, [error, navigate, toast]);

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
              <div className="text-center py-8 text-destructive">
                Failed to load RFIs. Please try again.
              </div>
            ) : rfis.length === 0 ? (
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
                    {rfis.map((rfi: RfiWithRfp) => (
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
                            {rfi.status || "pending"}
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