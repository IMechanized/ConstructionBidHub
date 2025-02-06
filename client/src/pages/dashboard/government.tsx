import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp, Bid } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import RfpForm from "@/components/rfp-form";
import EmployeeManagement from "@/components/employee-management";
import { DashboardSectionSkeleton, BidCardSkeleton } from "@/components/skeletons";

export default function GovernmentDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: bids, isLoading: loadingBids } = useQuery<Bid[]>({
    queryKey: ["/api/rfps/bids"],
  });

  useEffect(() => {
    if (user?.userType !== "government") {
      toast({
        title: "Unauthorized",
        description: "You must be a government organization to view this page",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const myRfps = rfps?.filter((rfp) => rfp.organizationId === user?.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">FindConstructionBids</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.companyName}
            </span>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="rfps">
          <TabsList className="mb-8">
            <TabsTrigger value="rfps">RFP Management</TabsTrigger>
            <TabsTrigger value="employees">Employee Management</TabsTrigger>
          </TabsList>

          <TabsContent value="rfps">
            <div className="mb-8">
              <RfpForm />
            </div>

            <h2 className="text-xl font-semibold mb-6">My RFPs</h2>
            {loadingRfps ? (
              <DashboardSectionSkeleton count={6} />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myRfps?.map((rfp) => (
                  <Card key={rfp.id}>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-2">{rfp.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {rfp.description}
                      </p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm">
                          Budget: ${rfp.budget.toLocaleString()}
                        </span>
                        <span className="text-sm">
                          Due: {new Date(rfp.deadline).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="font-medium mb-2">Bids</h4>
                      {loadingBids ? (
                        <div className="space-y-2">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="p-2 bg-secondary rounded">
                              <BidCardSkeleton />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {bids
                            ?.filter((bid) => bid.rfpId === rfp.id)
                            .map((bid) => (
                              <div
                                key={bid.id}
                                className="text-sm p-2 bg-secondary rounded"
                              >
                                <div className="flex justify-between">
                                  <span>Bid Amount: ${bid.amount}</span>
                                  <span>Contractor #{bid.contractorId}</span>
                                </div>
                                <p className="mt-1 text-muted-foreground">
                                  {bid.proposal}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}