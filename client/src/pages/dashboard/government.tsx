import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp, Bid } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import RfpForm from "@/components/rfp-form";
import EmployeeManagement from "@/components/employee-management";
import { DashboardSectionSkeleton, BidCardSkeleton } from "@/components/skeletons";

export default function GovernmentDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: bids, isLoading: loadingBids } = useQuery<Bid[]>({
    queryKey: ["/api/rfps/bids"],
  });

  const myRfps = rfps?.filter((rfp) => rfp.organizationId === user?.id);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  useEffect(() => {
    if (user?.userType !== "government") {
      toast({
        title: "Unauthorized",
        description: "You must be a government organization to view this page",
        variant: "destructive",
      });
    }
  }, [user, toast]);

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
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold">My RFPs</h2>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create RFP
              </Button>
            </div>

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
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Location:</span>
                          <span>{rfp.jobLocation}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Budget:</span>
                          <span>
                            {rfp.budgetMin
                              ? `Minimum $${rfp.budgetMin.toLocaleString()}`
                              : "Not specified"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Walkthrough:</span>
                          <span>{new Date(rfp.walkthroughDate).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">RFI Due:</span>
                          <span>{new Date(rfp.rfiDate).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Deadline:</span>
                          <span>{new Date(rfp.deadline).toLocaleString()}</span>
                        </div>
                      </div>

                      {rfp.certificationGoals && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-1">Certification Goals:</h4>
                          <p className="text-sm text-muted-foreground">{rfp.certificationGoals}</p>
                        </div>
                      )}

                      {rfp.portfolioLink && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-1">Portfolio:</h4>
                          <a
                            href={rfp.portfolioLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            View Portfolio
                          </a>
                        </div>
                      )}

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
                              <div key={bid.id} className="text-sm p-2 bg-secondary rounded">
                                <div className="flex justify-between">
                                  <span>Bid Amount: ${bid.amount.toLocaleString()}</span>
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

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New RFP</DialogTitle>
            </DialogHeader>
            <RfpForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}