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
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function NewRfps() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["deadline"]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "New RFPs",
      href: "/dashboard/new",
    },
  ];

  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const twentyFourHoursAgo = subHours(new Date(), 24);
  const locations = US_STATES_AND_TERRITORIES;

  let newRfps = rfps?.filter(rfp => {
    if (!(!rfp.featured && isAfter(new Date(rfp.createdAt), twentyFourHoursAgo))) return false;

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

  // Apply multi-select filters
  const budgetFilters = ["under50k", "50k-100k", "100k-250k", "250k-500k", "500k+"];
  const deadlineFilters = ["next7days", "next30days", "next3months"];
  
  const selectedBudgets = selectedFilters.filter(f => budgetFilters.includes(f));
  const selectedCerts = selectedFilters.filter(f => CERTIFICATIONS.includes(f));
  const selectedDeadlines = selectedFilters.filter(f => deadlineFilters.includes(f));
  
  // Apply budget filters (OR within category)
  if (selectedBudgets.length > 0) {
    newRfps = newRfps.filter(rfp => {
      if (rfp.budgetMin == null) return false;
      const budgetMin = rfp.budgetMin;
      
      return selectedBudgets.some(filter => {
        switch (filter) {
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
            return false;
        }
      });
    });
  }
  
  // Apply certification filters (OR within category)
  if (selectedCerts.length > 0) {
    newRfps = newRfps.filter(rfp => {
      if (!rfp.certificationGoals || rfp.certificationGoals.length === 0) return false;
      return selectedCerts.some(cert => rfp.certificationGoals.includes(cert));
    });
  }
  
  // Apply deadline filters (OR within category)
  if (selectedDeadlines.length > 0) {
    const now = new Date();
    newRfps = newRfps.filter(rfp => {
      const deadline = new Date(rfp.deadline);
      return selectedDeadlines.some(filter => {
        switch (filter) {
          case "next7days":
            return deadline <= addDays(now, 7) && deadline >= now;
          case "next30days":
            return deadline <= addDays(now, 30) && deadline >= now;
          case "next3months":
            return deadline <= addMonths(now, 3) && deadline >= now;
          default:
            return false;
        }
      });
    });
  }

  // Apply sorting
  const sortOptions = ["priceAsc", "priceDesc", "deadline"];
  const activeSort = selectedFilters.find(f => sortOptions.includes(f)) || "deadline";
  
  newRfps = [...newRfps].sort((a, b) => {
    switch (activeSort) {
      case "priceAsc":
        return (a.budgetMin || 0) - (b.budgetMin || 0);
      case "priceDesc":
        return (b.budgetMin || 0) - (a.budgetMin || 0);
      case "deadline":
      default:
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
  });

  const totalPages = Math.ceil(newRfps.length / itemsPerPage);
  const paginatedRfps = newRfps.slice(
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
                <h2 className="text-2xl font-bold">New RFPs</h2>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-[200px] justify-between" data-testid="button-filter">
                        <span className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Sort & Filter
                        </span>
                        {selectedFilters.length > 0 && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {selectedFilters.length}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-4" align="start">
                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        <div>
                          <h4 className="mb-2 text-sm font-semibold">SORT BY</h4>
                          <div className="space-y-2">
                            {[
                              { value: "deadline", label: "Deadline" },
                              { value: "priceAsc", label: "Price Low to High" },
                              { value: "priceDesc", label: "Price High to Low" }
                            ].map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={option.value}
                                  checked={selectedFilters.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedFilters([...selectedFilters, option.value]);
                                    } else {
                                      setSelectedFilters(selectedFilters.filter(f => f !== option.value));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  data-testid={`checkbox-${option.value}`}
                                />
                                <Label htmlFor={option.value} className="text-sm font-normal cursor-pointer">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 text-sm font-semibold">PROJECT SIZE</h4>
                          <div className="space-y-2">
                            {[
                              { value: "under50k", label: "Under $50k" },
                              { value: "50k-100k", label: "$50k - $100k" },
                              { value: "100k-250k", label: "$100k - $250k" },
                              { value: "250k-500k", label: "$250k - $500k" },
                              { value: "500k+", label: "$500k+" }
                            ].map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={option.value}
                                  checked={selectedFilters.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedFilters([...selectedFilters, option.value]);
                                    } else {
                                      setSelectedFilters(selectedFilters.filter(f => f !== option.value));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  data-testid={`checkbox-${option.value}`}
                                />
                                <Label htmlFor={option.value} className="text-sm font-normal cursor-pointer">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 text-sm font-semibold">CERTIFICATIONS</h4>
                          <div className="space-y-2">
                            {CERTIFICATIONS.map((cert) => (
                              <div key={cert} className="flex items-center space-x-2">
                                <Checkbox
                                  id={cert}
                                  checked={selectedFilters.includes(cert)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedFilters([...selectedFilters, cert]);
                                    } else {
                                      setSelectedFilters(selectedFilters.filter(f => f !== cert));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  data-testid={`checkbox-${cert}`}
                                />
                                <Label htmlFor={cert} className="text-sm font-normal cursor-pointer">
                                  {cert}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 text-sm font-semibold">DEADLINE RANGE</h4>
                          <div className="space-y-2">
                            {[
                              { value: "next7days", label: "Next 7 Days" },
                              { value: "next30days", label: "Next 30 Days" },
                              { value: "next3months", label: "Next 3 Months" }
                            ].map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={option.value}
                                  checked={selectedFilters.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedFilters([...selectedFilters, option.value]);
                                    } else {
                                      setSelectedFilters(selectedFilters.filter(f => f !== option.value));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  data-testid={`checkbox-${option.value}`}
                                />
                                <Label htmlFor={option.value} className="text-sm font-normal cursor-pointer">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

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
                        isNew={true}
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