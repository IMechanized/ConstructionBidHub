import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { isAfter, subHours } from "date-fns";
import { RfpCard } from "@/components/rfp-card";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

type SortOption = "none" | "priceAsc" | "priceDesc" | "deadline";

export default function Dashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [locationFilter, setLocationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const twentyFourHoursAgo = subHours(new Date(), 24);
  const myRfps = rfps?.filter((rfp) => rfp.organizationId === user?.id) || [];

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  const locations = Array.from(new Set(rfps?.map((rfp) => rfp.jobLocation) || [])).sort();

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
    if (locationFilter && locationFilter !== "all") {
      filtered = filtered.filter((rfp) =>
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
  const totalPages = Math.ceil(filteredMyRfps.length / itemsPerPage);
  const paginatedRfps = filteredMyRfps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto px-4 xl:px-8 2xl:px-16 mt-14 md:mt-0">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                <h2 className="text-xl font-semibold">My RFPs</h2>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Create RFP
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search RFPs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex flex-row sm:flex-col md:flex-row gap-2">
                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
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
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loadingRfps ? (
                <DashboardSectionSkeleton count={9} />
              ) : (
                <>
                  <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedRfps.map((rfp) => (
                      <RfpCard
                        key={rfp.id}
                        rfp={rfp}
                        isNew={isAfter(new Date(rfp.createdAt), twentyFourHoursAgo)}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <Pagination className="mt-6">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle>Create New RFP</DialogTitle>
          </DialogHeader>
          <RfpForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}