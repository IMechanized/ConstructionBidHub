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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

type SortOption = "none" | "priceAsc" | "priceDesc" | "deadline";

export default function AllRfps() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("deadline");
  const [locationFilter, setLocationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [certificationFilter, setCertificationFilter] = useState<string[]>([]);
  const [deadlineFilter, setDeadlineFilter] = useState("all");

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "All RFPs",
      href: "/dashboard/all",
    },
  ];

  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const locations = US_STATES_AND_TERRITORIES;

  const filteredRfps = rfps?.filter((rfp) => {
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

    // Apply budget filter
    if (budgetFilter && budgetFilter !== "all") {
      if (rfp.budgetMin == null) {
        matches = false;
      } else {
        const budgetMin = rfp.budgetMin;
        let budgetMatches = false;
        
        switch (budgetFilter) {
          case "under50k":
            budgetMatches = budgetMin < 50000;
            break;
          case "50k-100k":
            budgetMatches = budgetMin >= 50000 && budgetMin < 100000;
            break;
          case "100k-250k":
            budgetMatches = budgetMin >= 100000 && budgetMin < 250000;
            break;
          case "250k-500k":
            budgetMatches = budgetMin >= 250000 && budgetMin < 500000;
            break;
          case "500k+":
            budgetMatches = budgetMin >= 500000;
            break;
        }
        matches = matches && budgetMatches;
      }
    }

    // Apply certification filter
    if (certificationFilter.length > 0) {
      if (!rfp.certificationGoals || rfp.certificationGoals.length === 0) {
        matches = false;
      } else {
        matches = matches && certificationFilter.some(cert => rfp.certificationGoals?.includes(cert));
      }
    }

    // Apply deadline filter
    if (deadlineFilter && deadlineFilter !== "all") {
      const now = new Date();
      const deadline = new Date(rfp.deadline);
      let deadlineMatches = false;
      
      switch (deadlineFilter) {
        case "next7days":
          deadlineMatches = deadline <= addDays(now, 7) && deadline >= now;
          break;
        case "next30days":
          deadlineMatches = deadline <= addDays(now, 30) && deadline >= now;
          break;
        case "next3months":
          deadlineMatches = deadline <= addMonths(now, 3) && deadline >= now;
          break;
      }
      matches = matches && deadlineMatches;
    }

    return matches;
  }).sort((a, b) => {
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

  const totalPages = Math.ceil(filteredRfps.length / itemsPerPage);
  const paginatedRfps = filteredRfps.slice(
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
                <h2 className="text-2xl font-bold">All RFPs</h2>
              </div>

              <div className="flex flex-col gap-3">
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
                    <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                      <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-sort">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="priceAsc">RFP Amount: Low to High</SelectItem>
                        <SelectItem value="priceDesc">RFP Amount: High to Low</SelectItem>
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

                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={budgetFilter}
                    onValueChange={(value) => {
                      setBudgetFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-budget">
                      <SelectValue placeholder="Project Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      <SelectItem value="under50k">Under $50k</SelectItem>
                      <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                      <SelectItem value="100k-250k">$100k - $250k</SelectItem>
                      <SelectItem value="250k-500k">$250k - $500k</SelectItem>
                      <SelectItem value="500k+">$500k+</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-[200px]" data-testid="button-certifications">
                        <Filter className="mr-2 h-4 w-4" />
                        Certifications
                        {certificationFilter.length > 0 && ` (${certificationFilter.length})`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Contractor Requirements</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {CERTIFICATIONS.map((cert) => (
                            <div key={cert} className="flex items-center space-x-2">
                              <Checkbox
                                id={cert}
                                checked={certificationFilter.includes(cert)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setCertificationFilter([...certificationFilter, cert]);
                                  } else {
                                    setCertificationFilter(certificationFilter.filter(c => c !== cert));
                                  }
                                  setCurrentPage(1);
                                }}
                                data-testid={`checkbox-cert-${cert}`}
                              />
                              <Label htmlFor={cert} className="text-sm cursor-pointer">
                                {cert}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Select
                    value={deadlineFilter}
                    onValueChange={(value) => {
                      setDeadlineFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-deadline">
                      <SelectValue placeholder="Deadline Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Deadlines</SelectItem>
                      <SelectItem value="next7days">Next 7 Days</SelectItem>
                      <SelectItem value="next30days">Next 30 Days</SelectItem>
                      <SelectItem value="next3months">Next 3 Months</SelectItem>
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