import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Rfi, User } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { RfiConversation } from "@/components/rfi-conversation";

export default function RfiManagementPage() {
  const [, params] = useRoute("/dashboard/rfi-management/:id");
  const rfpId = params?.id;
  const { toast } = useToast();
  const [selectedRfi, setSelectedRfi] = useState<(Rfi & { organization?: User }) | null>(null);

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

  const { data: rfis, isLoading } = useQuery<(Rfi & { organization?: User })[]>({
    queryKey: [`/api/rfps/${rfpId}/rfi`],
    enabled: !!rfpId,
  });

  const updateRfiStatus = useMutation({
    mutationFn: async ({ rfiId, status }: { rfiId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/rfps/${rfpId}/rfi/${rfiId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rfps/${rfpId}/rfi`] });
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
            <div className="flex items-center gap-4">
              {selectedRfi && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRfi(null)}
                  data-testid="back-to-list-button"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to RFI List
                </Button>
              )}
              <h1 className="text-2xl font-bold">
                {selectedRfi ? "RFI Conversation" : "RFI Management"}
              </h1>
            </div>

            {selectedRfi ? (
              <RfiConversation
                rfi={selectedRfi}
                onClose={() => setSelectedRfi(null)}
                rfpId={Number(rfpId)}
              />
            ) : isLoading ? (
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
                      <TableRow key={rfi.id} data-testid={`rfi-row-${rfi.id}`}>
                        <TableCell className="font-medium">
                          {rfi.organization?.companyName || "N/A"}
                        </TableCell>
                        <TableCell>{rfi.email}</TableCell>
                        <TableCell>
                          {format(new Date(rfi.createdAt), "PPp")}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="truncate">{rfi.message}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rfi.status === "pending" ? "secondary" : "default"}>
                            {rfi.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRfi(rfi)}
                              data-testid={`view-conversation-${rfi.id}`}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              View Chat
                            </Button>
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
                              data-testid={`status-toggle-${rfi.id}`}
                            >
                              {rfi.status === "pending" ? "Mark as Responded" : "Mark as Pending"}
                            </Button>
                          </div>
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