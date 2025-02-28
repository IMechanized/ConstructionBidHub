import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp, Bid } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import BidForm from "@/components/bid-form";
import EmployeeManagement from "@/components/employee-management";
import { DashboardSectionSkeleton, BidCardSkeleton } from "@/components/skeletons";
import SettingsForm from "@/components/settings-form";
import { Link } from "wouter";
import { MobileMenu } from "@/components/mobile-menu";

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

  const filteredRfps = rfps?.filter(
    (rfp) =>
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myBids = bids?.filter((bid) => bid.contractorId === user?.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold hover:text-primary transition-colors">
              FindConstructionBids
            </Link>
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
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
            {/* Mobile Menu */}
            <div className="md:hidden">
              <MobileMenu
                companyName={user?.companyName}
                logo={user?.logo}
                onLogout={() => logoutMutation.mutate()}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="rfps" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 pb-3">
            <TabsList className="w-[500px] sm:w-full flex">
              <TabsTrigger value="rfps" className="flex-1">Available RFPs</TabsTrigger>
              <TabsTrigger value="bids" className="flex-1">My Bids</TabsTrigger>
              <TabsTrigger value="employees" className="flex-1">Employee Management</TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="rfps">
            <div className="mb-6">
              <div className="relative max-w-md mx-auto sm:mx-0">
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
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredRfps?.map((rfp) => (
                  <Card key={rfp.id}>
                    <CardContent className="p-4 sm:p-6">
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

                      {rfp.certificationGoals && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-1">Certification Goals:</h4>
                          <p className="text-sm text-muted-foreground">{rfp.certificationGoals}</p>
                        </div>
                      )}

                      <BidForm rfpId={rfp.id} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bids">
            {loadingBids ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 sm:p-6">
                      <BidCardSkeleton />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {myBids?.map((bid) => (
                  <Card key={bid.id}>
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="text-lg font-semibold mb-2">
                        Bid for RFP #{bid.rfpId}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
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