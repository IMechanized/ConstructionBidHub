import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Rfi } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { format } from "date-fns";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

export default function RfiManagementPage() {
  const [, params] = useRoute("/dashboard/rfi-management/:id");
  const rfpId = params?.id;
  const { toast } = useToast();

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "RFI Management",
      href: "/dashboard/rfis",
    },
    {
      label: "RFI Details",
      href: `/dashboard/rfi-management/${rfpId}`,
    },
  ];

  const { data: rfis, isLoading } = useQuery<Rfi[]>({
    queryKey: ["/api/rfps", rfpId, "rfis"],
    enabled: !!rfpId,
  });

  const updateRfiStatus = useMutation({
    mutationFn: async ({ rfiId, status }: { rfiId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/rfps/${rfpId}/rfi/${rfiId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfps", rfpId, "rfis"] });
      toast({
        title: "Success",
        description: "RFI status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update RFI status",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentPath={`/dashboard/rfi-management/${rfpId}`} />

      <main className="md:ml-[280px] min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl mt-20 md:mt-0">
          <BreadcrumbNav items={breadcrumbItems} />

          <div className="space-y-6 mt-4">
            <h1 className="text-2xl font-bold">RFI Management</h1>

            {isLoading ? (
              <DashboardSectionSkeleton count={5} />
            ) : !rfis?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No RFIs found for this RFP.
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfis.map((rfi) => (
                      <TableRow key={rfi.id}>
                        <TableCell className="font-medium">
                          {rfi.companyName || "N/A"}
                        </TableCell>
                        <TableCell>{rfi.email}</TableCell>
                        <TableCell>
                          {format(new Date(rfi.createdAt), "PPp")}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="truncate">{rfi.message}</p>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{rfi.status}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={rfi.status === "pending" ? "outline" : "default"}
                            size="sm"
                            onClick={() => {
                              updateRfiStatus.mutate({
                                rfiId: rfi.id,
                                status: rfi.status === "pending" ? "responded" : "pending",
                              });
                            }}
                            disabled={updateRfiStatus.isPending}
                          >
                            {rfi.status === "pending" ? "Mark as Responded" : "Mark as Pending"}
                          </Button>
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