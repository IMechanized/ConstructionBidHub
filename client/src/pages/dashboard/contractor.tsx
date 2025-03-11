import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Rfp, Rfi } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import EmployeeManagement from "@/components/employee-management";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import SettingsForm from "@/components/settings-form";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

type SortOption = "none" | "priceAsc" | "priceDesc" | "deadline";

export default function ContractorDashboard() {
  const { user, logoutMutation } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [locationFilter, setLocationFilter] = useState("all");
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("rfps");
  const isMobile = useIsMobile();

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: rfis, isLoading: loadingRfis } = useQuery<(Rfi & { rfp: Rfp | null })[]>({
    queryKey: ["/api/rfis"],
  });

  const locations = Array.from(new Set(rfps?.map(rfp => rfp.jobLocation) || [])).sort();

  const filteredRfps = rfps?.filter(
    (rfp) => {
      let matches = true;

      // Search filter
      if (searchTerm) {
        matches = matches && (
          rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfp.jobLocation.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Location filter
      if (locationFilter && locationFilter !== "all") {
        matches = matches && rfp.jobLocation.toLowerCase().includes(locationFilter.toLowerCase());
      }

      return matches;
    }
  ).sort((a, b) => {
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
  }) || [];

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen overflow-hidden">
          <DashboardSidebar currentPath={location} />

          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="rfps">RFPs</TabsTrigger>
                  <TabsTrigger value="rfis">RFIs</TabsTrigger>
                  <TabsTrigger value="employees">Employees</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="rfps" className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search RFPs..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {loadingRfps ? (
                    <DashboardSectionSkeleton count={6} />
                  ) : (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {filteredRfps.map((rfp) => (
                        <div key={rfp.id} className="bg-card rounded-lg border p-6">
                          <h3 className="font-semibold mb-4">{rfp.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {rfp.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Location:</span>
                              <span>{rfp.jobLocation}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Budget:</span>
                              <span>
                                {rfp.budgetMin
                                  ? `$${rfp.budgetMin.toLocaleString()}`
                                  : "Not specified"}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Deadline:</span>
                              <span>{format(new Date(rfp.deadline), "PPp")}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="rfis">
                  {loadingRfis ? (
                    <DashboardSectionSkeleton count={3} />
                  ) : (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {rfis?.map((rfi) => (
                        <div key={rfi.id} className="bg-card rounded-lg border p-6">
                          <h3 className="font-semibold mb-4">{rfi.rfp?.title || "Unknown RFP"}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {rfi.message}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Status:</span>
                              <span className="capitalize">{rfi.status}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Submitted:</span>
                              <span>{format(new Date(rfi.createdAt), "PPp")}</span>
                            </div>
                          </div>
                        </div>
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
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}