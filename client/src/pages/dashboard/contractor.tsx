import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp, Bid } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import BidForm from "@/components/bid-form";
import EmployeeManagement from "@/components/employee-management";
import { DashboardSectionSkeleton, BidCardSkeleton } from "@/components/skeletons";
import SettingsForm from "@/components/settings-form";

export default function ContractorDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: bids, isLoading: loadingBids } = useQuery<Bid[]>({
    queryKey: ["/api/rfps/bids"],
  });

  useEffect(() => {
    if (user?.userType !== "contractor") {
      toast({
        title: "Unauthorized",
        description: "You must be a contractor to view this page",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const filteredRfps = rfps?.filter(
    (rfp) =>
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myBids = bids?.filter((bid) => bid.contractorId === user?.id);

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
            <TabsTrigger value="rfps">Available RFPs</TabsTrigger>
            <TabsTrigger value="bids">My Bids</TabsTrigger>
            <TabsTrigger value="employees">Employee Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="rfps">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search RFPs..."
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
                {filteredRfps?.map((rfp) => (
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
                      <BidForm rfpId={rfp.id} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bids">
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
      </main>
    </div>
  );
}