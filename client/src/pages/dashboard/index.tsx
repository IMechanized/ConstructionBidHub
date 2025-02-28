import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp, Bid } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import RfpForm from "@/components/rfp-form";
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
    queryKey: ["/api/bids"],
  });

  const myRfps = rfps?.filter((rfp) => rfp.organizationId === user?.id) || [];

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold hover:text-primary transition-colors">
            FindConstructionBids
          </Link>
          <div className="flex items-center gap-4">
            {user?.logo && (
              <img
                src={user.logo}
                alt={`${user.companyName} logo`}
                className="h-8 w-8 object-contain rounded-full"
              />
            )}
            <span className="text-sm text-muted-foreground hidden md:inline">
              {user?.companyName}
            </span>
            <Button variant="outline" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="rfps" className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="rfps" className="flex-1">RFP Management</TabsTrigger>
            <TabsTrigger value="bids" className="flex-1">My Bids</TabsTrigger>
            <TabsTrigger value="employees" className="flex-1">Employee Management</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
            <TabsTrigger value="analytics" asChild className="flex-1">
              <Link href="/dashboard/analytics">Analytics</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rfps">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <h2 className="text-xl font-semibold">My RFPs</h2>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create RFP
              </Button>
            </div>

            <div className="relative mb-6">
              <Input
                placeholder="Search RFPs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {myRfps.map((rfp) => (
                <Card key={rfp.id}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{rfp.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {rfp.description}
                    </p>
                    <div className="space-y-2">
                      {bids?.filter(bid => bid.rfpId === rfp.id).map((bid) => (
                        <div key={bid.id} className="text-sm p-3 bg-muted rounded-lg">
                          <div className="flex justify-between mb-1">
                            <span>Bid Amount: ${bid.amount.toLocaleString()}</span>
                            <span>Contractor #{bid.contractorId}</span>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">
                            {bid.proposal}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bids">
            {loadingBids ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <BidCardSkeleton />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {bids?.map((bid) => (
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