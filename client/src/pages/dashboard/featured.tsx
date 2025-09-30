import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { RfpCard } from "@/components/rfp-card";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { isAfter, subHours, addDays, addMonths } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { US_STATES_AND_TERRITORIES } from "@/lib/utils";
import { CERTIFICATIONS } from "@shared/schema";

export default function FeaturedRfps() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [consolidatedFilter, setConsolidatedFilter] = useState("deadline");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Featured RFPs",
      href: "/dashboard/featured",
    },
  ];

  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const locations = US_STATES_AND_TERRITORIES;

  let featuredRfps = rfps?.filter(rfp => {
    if (!rfp.featured) return false;
    
    // Hide RFPs past their deadline
    if (new Date(rfp.deadline) < new Date()) return false;

    let matches = true;

    if (searchTerm) {
      matches = matches && (
        rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfp.jobStreet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfp.jobCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfp.jobState.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfp.jobZip.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter && locationFilter !== "all") {
      matches = matches && rfp.jobState.toLowerCase().includes(locationFilter.toLowerCase());
    }

    return matches;
  }) || [];

  // Apply consolidated filter (budget, certification, or deadline range)
  const budgetFilters = ["under50k", "50k-100k", "100k-250k", "250k-500k", "500k+"];
  const deadlineFilters = ["next7days", "next30days", "next3months"];
  
  if (budgetFilters.includes(consolidatedFilter)) {
    featuredRfps = featuredRfps.filter(rfp => {
      if (rfp.budgetMin == null) return false;
      const budgetMin = rfp.budgetMin;
      
      switch (consolidatedFilter) {
        case "under50k":
          return budgetMin < 50000;
        case "50k-100k":
          return budgetMin >= 50000 && budgetMin < 100000;
        case "100k-250k":
          return budgetMin >= 100000 && budgetMin < 250000;
        case "250k-500k":
          return budgetMin >= 250000 && budgetMin < 500000;
        case "500k+":
          return budgetMin >= 500000;
        default:
          return true;
      }
    });
  } else if (CERTIFICATIONS.includes(consolidatedFilter)) {
    featuredRfps = featuredRfps.filter(rfp => {
      if (!rfp.certificationGoals || rfp.certificationGoals.length === 0) return false;
      return rfp.certificationGoals.includes(consolidatedFilter);
    });
  } else if (deadlineFilters.includes(consolidatedFilter)) {
    const now = new Date();
    featuredRfps = featuredRfps.filter(rfp => {
      const deadline = new Date(rfp.deadline);
      switch (consolidatedFilter) {
        case "next7days":
          return deadline <= addDays(now, 7) && deadline >= now;
        case "next30days":
          return deadline <= addDays(now, 30) && deadline >= now;
        case "next3months":
          return deadline <= addMonths(now, 3) && deadline >= now;
        default:
          return true;
      }
    });
  }

  // Apply sorting (default or explicit)
  featuredRfps = [...featuredRfps].sort((a, b) => {
    switch (consolidatedFilter) {
      case "priceAsc":
        return (a.budgetMin || 0) - (b.budgetMin || 0);
      case "priceDesc":
        return (b.budgetMin || 0) - (a.budgetMin || 0);
      case "deadline":
      default:
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
  });

  const totalPages = Math.ceil(featuredRfps.length / itemsPerPage);
  const paginatedRfps = featuredRfps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />

            <div className="space-y-6 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Featured RFPs</h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search RFPs..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full"
                    data-testid="input-search-rfps"
                  />
                </div>

                <div className="flex flex-row sm:flex-col md:flex-row gap-2">
                  <Select 
                    value={consolidatedFilter} 
                    onValueChange={(value) => {
                      setConsolidatedFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter">
                      <SelectValue placeholder="Sort & Filter" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <SelectItem value="deadline">Sort: Deadline</SelectItem>
                      <SelectItem value="priceAsc">Sort: Price Low to High</SelectItem>
                      <SelectItem value="priceDesc">Sort: Price High to Low</SelectItem>
                      
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">PROJECT SIZE</div>
                      <SelectItem value="under50k">Under $50k</SelectItem>
                      <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                      <SelectItem value="100k-250k">$100k - $250k</SelectItem>
                      <SelectItem value="250k-500k">$250k - $500k</SelectItem>
                      <SelectItem value="500k+">$500k+</SelectItem>
                      
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">CERTIFICATIONS</div>
                      {CERTIFICATIONS.map((cert) => (
                        <SelectItem key={cert} value={cert}>{cert}</SelectItem>
                      ))}
                      
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">DEADLINE RANGE</div>
                      <SelectItem value="next7days">Next 7 Days</SelectItem>
                      <SelectItem value="next30days">Next 30 Days</SelectItem>
                      <SelectItem value="next3months">Next 3 Months</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={locationFilter}
                    onValueChange={(value) => {
                      setLocationFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-location">
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

              {isLoading ? (
                <DashboardSectionSkeleton count={9} />
              ) : (
                <>
                  <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedRfps.map((rfp) => (
                      <RfpCard
                        key={rfp.id}
                        rfp={rfp}
                        isNew={isAfter(new Date(rfp.createdAt), subHours(new Date(), 24))}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <Pagination className="mt-6">
                      <PaginationContent className="flex flex-wrap justify-center gap-1">
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
    </div>
  );
}