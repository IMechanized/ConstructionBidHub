import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp, Bid, User } from "@shared/schema";
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
import { Search } from "lucide-react";
import RfpForm from "@/components/rfp-form";
import { RfpCard } from "@/components/rfp-card";
import BidForm from "@/components/bid-form";
import EmployeeManagement from "@/components/employee-management";
import SettingsForm from "@/components/settings-form";
import { DashboardSectionSkeleton, BidCardSkeleton } from "@/components/skeletons";

const ITEMS_PER_PAGE = 16; // 4x4 grid
const FEATURED_ITEMS = 6; // 3x2 grid for featured items

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [featuredPage, setFeaturedPage] = useState(1);
  const [availablePage, setAvailablePage] = useState(1);

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get the users map for easy lookup
  const usersMap = users?.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as { [key: number]: User }) ?? {};

  const myRfps = rfps?.filter((rfp) => rfp.organizationId === user?.id) || [];
  const availableRfps = rfps?.filter((rfp) => rfp.organizationId !== user?.id) || [];
  const featuredRfps = availableRfps.filter((rfp) => rfp.featured);
  const nonFeaturedRfps = availableRfps.filter((rfp) => !rfp.featured);

  const filteredMyRfps = myRfps.filter(
    (rfp) =>
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.jobLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFeaturedRfps = featuredRfps.filter(
    (rfp) =>
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.jobLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAvailableRfps = nonFeaturedRfps.filter(
    (rfp) =>
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.jobLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination for My RFPs
  const totalMyPages = Math.ceil(filteredMyRfps.length / ITEMS_PER_PAGE);
  const paginatedMyRfps = filteredMyRfps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Pagination for Featured RFPs
  const totalFeaturedPages = Math.ceil(filteredFeaturedRfps.length / ITEMS_PER_PAGE);
  const paginatedFeaturedRfps = filteredFeaturedRfps.slice(
    (featuredPage - 1) * ITEMS_PER_PAGE,
    featuredPage * ITEMS_PER_PAGE
  );

  // Pagination for Available RFPs
  const totalAvailablePages = Math.ceil(filteredAvailableRfps.length / ITEMS_PER_PAGE);
  const paginatedAvailableRfps = filteredAvailableRfps.slice(
    (availablePage - 1) * ITEMS_PER_PAGE,
    availablePage * ITEMS_PER_PAGE
  );

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  const { data: bids, isLoading: loadingBids } = useQuery<Bid[]>({
    queryKey: ["/api/rfps/bids"],
  });

  const myBids = bids?.filter((bid) => bid.contractorId === user?.id);

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
            <TabsTrigger value="featured">Featured RFPs</TabsTrigger>
            <TabsTrigger value="available">Available RFPs</TabsTrigger>
            <TabsTrigger value="my-rfps">My RFPs</TabsTrigger>
            <TabsTrigger value="my-bids">My Bids</TabsTrigger>
            <TabsTrigger value="employees">Employee Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics" asChild>
              <Link href="/dashboard/analytics" className="cursor-pointer">Analytics</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="featured">
            <div className="space-y-8">
              <h2 className="text-xl font-semibold mb-4">Featured RFPs</h2>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search featured RFPs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setFeaturedPage(1);
                  }}
                />
              </div>

              {loadingRfps ? (
                <DashboardSectionSkeleton count={ITEMS_PER_PAGE} />
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedFeaturedRfps.map((rfp) => (
                      <RfpCard
                        key={rfp.id}
                        rfp={rfp}
                        user={usersMap[rfp.organizationId]}
                      />
                    ))}
                  </div>

                  {totalFeaturedPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setFeaturedPage(featuredPage - 1)}
                        disabled={featuredPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4">
                        Page {featuredPage} of {totalFeaturedPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setFeaturedPage(featuredPage + 1)}
                        disabled={featuredPage === totalFeaturedPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="available">
            <div className="space-y-8">
              <h2 className="text-xl font-semibold mb-4">Available RFPs</h2>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search available RFPs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setAvailablePage(1);
                  }}
                />
              </div>

              {loadingRfps ? (
                <DashboardSectionSkeleton count={ITEMS_PER_PAGE} />
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {paginatedAvailableRfps.map((rfp) => (
                      <RfpCard
                        key={rfp.id}
                        rfp={rfp}
                        user={usersMap[rfp.organizationId]}
                      />
                    ))}
                  </div>

                  {totalAvailablePages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setAvailablePage(availablePage - 1)}
                        disabled={availablePage === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4">
                        Page {availablePage} of {totalAvailablePages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setAvailablePage(availablePage + 1)}
                        disabled={availablePage === totalAvailablePages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-rfps">
            <div className="space-y-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">My RFPs</h2>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Create RFP
                </Button>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search my RFPs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {loadingRfps ? (
                <DashboardSectionSkeleton count={ITEMS_PER_PAGE} />
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {paginatedMyRfps.map((rfp) => (
                      <RfpCard
                        key={rfp.id}
                        rfp={rfp}
                        user={usersMap[rfp.organizationId]}
                      />
                    ))}
                  </div>

                  {totalMyPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4">
                        Page {currentPage} of {totalMyPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalMyPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
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