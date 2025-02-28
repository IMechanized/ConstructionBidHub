import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { isAfter, subHours } from "date-fns";
import { RfpCard } from "@/components/rfp-card";
import { Link } from "wouter";
import { MobileMenu } from "@/components/mobile-menu";
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";

export default function GovernmentDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [location] = useLocation();

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: bids, isLoading: loadingBids } = useQuery<Bid[]>({
    queryKey: ["/api/rfps/bids"],
  });

  const twentyFourHoursAgo = subHours(new Date(), 24);
  const myRfps = rfps?.filter((rfp) => rfp.organizationId === user?.id);
  const newRfps = rfps?.filter((rfp) =>
    !rfp.featured &&
    isAfter(new Date(rfp.createdAt), twentyFourHoursAgo)
  );

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 h-14">
          <div className="flex justify-between items-center h-full">
            <Link href="/" className="text-xl md:text-2xl font-bold hover:text-primary transition-colors truncate flex-shrink">
              FindConstructionBids
            </Link>
            <MobileMenu
              companyName={user?.companyName}
              logo={user?.logo}
              onLogout={() => logoutMutation.mutate()}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="hidden md:block">
          <Tabs defaultValue="rfps" className="space-y-6">
            <TabsList className="w-full flex">
              <TabsTrigger value="rfps" className="flex-1">RFP Management</TabsTrigger>
              <TabsTrigger value="new" className="flex-1">New RFPs</TabsTrigger>
              <TabsTrigger value="employees" className="flex-1">Employee Management</TabsTrigger>
            </TabsList>

            <TabsContent value="rfps">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <h2 className="text-xl font-semibold">My RFPs</h2>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Create RFP
                </Button>
              </div>

              {loadingRfps ? (
                <DashboardSectionSkeleton count={6} />
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {myRfps?.map((rfp) => (
                    <Card key={rfp.id}>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-2">{rfp.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {rfp.description}
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                            <span className="font-medium">Location:</span>
                            <span className="text-right">{rfp.jobLocation}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                            <span className="font-medium">Budget:</span>
                            <span className="text-right">
                              {rfp.budgetMin
                                ? `$${rfp.budgetMin.toLocaleString()}`
                                : "Not specified"}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                            <span className="font-medium">Walkthrough:</span>
                            <span className="text-right">{new Date(rfp.walkthroughDate).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                            <span className="font-medium">RFI Due:</span>
                            <span className="text-right">{new Date(rfp.rfiDate).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                            <span className="font-medium">Deadline:</span>
                            <span className="text-right">{new Date(rfp.deadline).toLocaleString()}</span>
                          </div>
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
                                <div key={bid.id} className="text-sm p-2 bg-secondary rounded">
                                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                                    <span>Bid Amount: ${bid.amount.toLocaleString()}</span>
                                    <span>Contractor #{bid.contractorId}</span>
                                  </div>
                                  <p className="mt-2 text-muted-foreground line-clamp-3">
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

            <TabsContent value="new">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <h2 className="text-xl font-semibold">New RFPs (Last 24 Hours)</h2>
              </div>

              {loadingRfps ? (
                <DashboardSectionSkeleton count={6} />
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {newRfps?.map((rfp) => (
                    <RfpCard
                      key={rfp.id}
                      rfp={rfp}
                      isNew
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="employees">
              <EmployeeManagement />
            </TabsContent>
          </Tabs>
        </div>

        <MobileDashboardNav userType="government" currentPath={location} />
      </main>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New RFP</DialogTitle>
          </DialogHeader>
          <RfpForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}