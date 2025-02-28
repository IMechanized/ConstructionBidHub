import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp, Bid } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
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
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { isAfter, subHours } from "date-fns";
import { RfpCard } from "@/components/rfp-card";

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

  const twentyFourHoursAgo = subHours(new Date(), 24);
  const myRfps = rfps?.filter((rfp) => rfp.organizationId === user?.id) || [];
  const availableRfps = rfps?.filter((rfp) => rfp.organizationId !== user?.id) || [];
  const featuredRfps = availableRfps.filter((rfp) => rfp.featured);
  const newRfps = availableRfps.filter((rfp) =>
    !rfp.featured &&
    isAfter(new Date(rfp.createdAt), twentyFourHoursAgo)
  );
  const otherRfps = availableRfps.filter((rfp) =>
    !rfp.featured &&
    !isAfter(new Date(rfp.createdAt), twentyFourHoursAgo)
  );

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  const filteredRfps = myRfps.filter(
    (rfp) =>
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Tabs defaultValue="my-rfps" className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="my-rfps" className="flex-1">My RFPs</TabsTrigger>
            <TabsTrigger value="featured" className="flex-1">Featured RFPs</TabsTrigger>
            <TabsTrigger value="new" className="flex-1">New RFPs</TabsTrigger>
            <TabsTrigger value="available" className="flex-1">Available RFPs</TabsTrigger>
            <TabsTrigger value="bids" className="flex-1">My Bids</TabsTrigger>
            <TabsTrigger value="employees" className="flex-1">Employees</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
            <TabsTrigger value="analytics" asChild className="flex-1">
              <Link href="/dashboard/analytics">Analytics</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-rfps">
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

            {loadingRfps ? (
              <DashboardSectionSkeleton count={6} />
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredRfps.map((rfp) => (
                  <RfpCard
                    key={rfp.id}
                    rfp={rfp}
                    isNew={isAfter(new Date(rfp.createdAt), twentyFourHoursAgo)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="featured">
            <h2 className="text-xl font-semibold mb-6">Featured Opportunities</h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {featuredRfps.map((rfp) => (
                <RfpCard
                  key={rfp.id}
                  rfp={rfp}
                  isNew={isAfter(new Date(rfp.createdAt), twentyFourHoursAgo)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="new">
            <h2 className="text-xl font-semibold mb-6">New Opportunities (Last 24h)</h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {newRfps.map((rfp) => (
                <RfpCard
                  key={rfp.id}
                  rfp={rfp}
                  isNew={true}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="available">
            <h2 className="text-xl font-semibold mb-6">Available Opportunities</h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {otherRfps.map((rfp) => (
                <RfpCard
                  key={rfp.id}
                  rfp={rfp}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bids">
            {loadingBids ? (
              <DashboardSectionSkeleton count={3} />
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {bids?.map((bid) => {
                  const rfp = rfps?.find(r => r.id === bid.rfpId);
                  return rfp ? (
                    <RfpCard
                      key={bid.id}
                      rfp={rfp}
                      compact
                    />
                  ) : null;
                })}
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