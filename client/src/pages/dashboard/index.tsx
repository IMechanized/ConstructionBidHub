import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp, Rfi } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import RfpForm from "@/components/rfp-form";
import EmployeeManagement from "@/components/employee-management";
import SettingsForm from "@/components/settings-form";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { isAfter, subHours, format } from "date-fns";
import { RfpCard } from "@/components/rfp-card";
import RfpReport from "@/components/rfp-report";

type SortOption = "none" | "priceAsc" | "priceDesc" | "deadline";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [locationFilter, setLocationFilter] = useState("");

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: rfis, isLoading: loadingRfis } = useQuery<Rfi[]>({
    queryKey: ["/api/rfis"],
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

  const locations = Array.from(new Set(rfps?.map(rfp => rfp.jobLocation) || [])).sort();

  const applyFilters = (rfpList: Rfp[]) => {
    let filtered = rfpList;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (rfp) =>
          rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfp.jobLocation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(rfp =>
        rfp.jobLocation.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "priceAsc":
          return (a.budgetMin || 0) - (b.budgetMin || 0);
        case "priceDesc":
          return (b.budgetMin || 0) - (a.budgetMin || 0);
        case "deadline":
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredMyRfps = applyFilters(myRfps);
  const filteredFeaturedRfps = applyFilters(featuredRfps);
  const filteredNewRfps = applyFilters(newRfps);
  const filteredOtherRfps = applyFilters(otherRfps);

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
            <TabsTrigger value="bids" className="flex-1">My RFIs</TabsTrigger>
            <TabsTrigger value="reports" className="flex-1">Reports</TabsTrigger>
            <TabsTrigger value="employees" className="flex-1">Employees</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
            <TabsTrigger value="analytics" asChild className="flex-1">
              <Link href="/dashboard/analytics">Analytics</Link>
            </TabsTrigger>
            <TabsTrigger value="support" asChild className="flex-1">
              <Link href="/support">Support</Link>
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Search RFPs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default</SelectItem>
                <SelectItem value="priceAsc">Price: Low to High</SelectItem>
                <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={locationFilter}
              onValueChange={setLocationFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="my-rfps">
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
                {filteredMyRfps.map((rfp) => (
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
              {filteredFeaturedRfps.map((rfp) => (
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
              {filteredNewRfps.map((rfp) => (
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
              {filteredOtherRfps.map((rfp) => (
                <RfpCard
                  key={rfp.id}
                  rfp={rfp}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bids">
            {loadingRfis ? (
              <DashboardSectionSkeleton count={3} />
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {rfis?.map((rfi) => {
                  const rfp = rfps?.find(r => r.id === rfi.rfpId);
                  return rfp ? (
                    <div key={rfi.id} className="bg-card rounded-lg border p-6">
                      <h3 className="font-semibold mb-4">{rfp.title}</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {rfi.message}
                        </p>
                        <p className="text-sm">
                          Status: <span className="capitalize">{rfi.status}</span>
                        </p>
                        <p className="text-sm">
                          Submitted: {format(new Date(rfi.createdAt), "PPp")}
                        </p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <h2 className="text-xl font-semibold">RFP Reports</h2>
            </div>
            {loadingRfps ? (
              <DashboardSectionSkeleton count={3} />
            ) : (
              <RfpReport rfps={myRfps} />
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
            <RfpForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}