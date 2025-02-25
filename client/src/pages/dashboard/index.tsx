import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp, Bid } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import RfpForm from "@/components/rfp-form";
import BidForm from "@/components/bid-form";
import EmployeeManagement from "@/components/employee-management";
import SettingsForm from "@/components/settings-form";
import { DashboardSectionSkeleton, BidCardSkeleton } from "@/components/skeletons";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: bids, isLoading: loadingBids } = useQuery<Bid[]>({
    queryKey: ["/api/rfps/bids"],
  });

  const myRfps = rfps?.filter((rfp) => rfp.organizationId === user?.id);
  const availableRfps = rfps?.filter((rfp) => rfp.organizationId !== user?.id);
  const myBids = bids?.filter((bid) => bid.contractorId === user?.id);

  const filteredAvailableRfps = availableRfps?.filter(
    (rfp) =>
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.jobLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">FindConstructionBids</h1>
          <div className="flex items-center gap-4">
            {user?.logo && (
              <img
                src={user.logo}
                alt={`${user.companyName} logo`}
                className="h-8 w-8 object-contain"
              />
            )}
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
        <Tabs defaultValue="available">
          <TabsList className="mb-8">
            <TabsTrigger value="available">Available RFPs</TabsTrigger>
            <TabsTrigger value="my-rfps">My RFPs</TabsTrigger>
            <TabsTrigger value="my-bids">My Bids</TabsTrigger>
            <TabsTrigger value="employees">Employee Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search RFPs by title, description, or location..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loadingRfps ? (
              <DashboardSectionSkeleton count={6} />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAvailableRfps?.map((rfp) => (
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

                      <BidForm rfpId={rfp.id} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-rfps">
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

          <TabsContent value="my-bids">
            {loadingBids ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <BidCardSkeleton />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myBids?.map((bid) => (
                  <Card key={bid.id}>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-2">
                        Bid for RFP #{bid.rfpId}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {bid.proposal}
                      </p>
                      <div className="text-sm">
                        Amount: ${bid.amount.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsForm />
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