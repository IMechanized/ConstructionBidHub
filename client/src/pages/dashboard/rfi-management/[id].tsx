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
      label: "Reports",
      href: "/dashboard/reports",
    },
    {
      label: "RFI Management",
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
              <div className="space-y-4">
                {rfis.map((rfi) => (
                  <div
                    key={rfi.id}
                    className="bg-card border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{rfi.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted on {format(new Date(rfi.createdAt), "PPp")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
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
                      </div>
                    </div>
                    <p className="text-sm">{rfi.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}