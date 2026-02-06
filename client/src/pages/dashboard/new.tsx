import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { RfpCard } from "@/components/rfp-card";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { addDays, addMonths } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { US_STATES_AND_TERRITORIES } from "@/lib/utils";
import { CERTIFICATIONS, TRADE_OPTIONS } from "@shared/schema";
import { Filter, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AdvancedSearch, SearchFilter } from "@/components/advanced-search";
import { SavedFilters } from "@/components/saved-filters";
import { QuickFilterChips, QUICK_FILTERS } from "@/components/quick-filter-chips";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RfpForm from "@/components/rfp-form";
import { useToast } from "@/hooks/use-toast";

export default function NewRfps() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["deadline"]);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const itemsPerPage = 9;

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    toast({
      title: "Success",
      description: "RFP created successfully",
    });
  };

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

  const locations = US_STATES_AND_TERRITORIES;

  const allNonFeaturedRfps = rfps?.filter(rfp => 
    !rfp.featured && new Date(rfp.deadline) > new Date()
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const newestRfpIds = new Set(allNonFeaturedRfps.slice(0, 12).map(rfp => rfp.id));

  let newRfps = allNonFeaturedRfps.filter(rfp => {
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
  });

  // Apply multi-select filters
  const budgetFilters = ["under100k", "100k-500k", "500k-1m", "1m+"];
  const deadlineFilters = ["next7days", "next30days", "next3months"];
  
  const selectedBudgets = selectedFilters.filter(f => budgetFilters.includes(f));
  const selectedCerts = selectedFilters.filter(f => CERTIFICATIONS.includes(f));
  const selectedTrades = selectedFilters.filter(f => TRADE_OPTIONS.includes(f));
  const selectedDeadlines = selectedFilters.filter(f => deadlineFilters.includes(f));
  
  // Apply budget filters (OR within category)
  if (selectedBudgets.length > 0) {
    newRfps = newRfps.filter(rfp => {
      if (rfp.budgetMin == null) return false;
      const budgetMin = rfp.budgetMin;
      
      return selectedBudgets.some(filter => {
        switch (filter) {
          case "under100k":
            return budgetMin < 100000;
          case "100k-500k":
            return budgetMin >= 100000 && budgetMin < 500000;
          case "500k-1m":
            return budgetMin >= 500000 && budgetMin < 1000000;
          case "1m+":
            return budgetMin >= 1000000;
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
      return selectedCerts.some(cert => rfp.certificationGoals?.includes(cert));
    });
  }
  
  // Apply trade filters (OR within category)
  if (selectedTrades.length > 0) {
    newRfps = newRfps.filter(rfp => {
      if (!rfp.desiredTrades || rfp.desiredTrades.length === 0) return false;
      return selectedTrades.some(trade => rfp.desiredTrades?.includes(trade));
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

  // Apply advanced search filters
  const locationFilters = searchFilters.filter(f => f.type === "location");
  const tradeFilters = searchFilters.filter(f => f.type === "trade");
  const certFilters = searchFilters.filter(f => f.type === "certification");

  if (locationFilters.length > 0) {
    newRfps = newRfps.filter(rfp =>
      locationFilters.some(f => rfp.jobState.toLowerCase().includes(f.value.toLowerCase()))
    );
  }

  if (tradeFilters.length > 0) {
    newRfps = newRfps.filter(rfp => {
      if (!rfp.desiredTrades || rfp.desiredTrades.length === 0) return false;
      return tradeFilters.some(f => rfp.desiredTrades?.includes(f.value));
    });
  }

  if (certFilters.length > 0) {
    newRfps = newRfps.filter(rfp => {
      if (!rfp.certificationGoals || rfp.certificationGoals.length === 0) return false;
      return certFilters.some(f => rfp.certificationGoals?.includes(f.value));
    });
  }

  // Apply quick filter if active
  if (activeQuickFilter) {
    const quickFilter = QUICK_FILTERS.find(f => f.id === activeQuickFilter);
    if (quickFilter) {
      newRfps = newRfps.filter(quickFilter.filterFn);
    }
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

  const handleFilterChange = (newFilters: SearchFilter[]) => {
    setSearchFilters(newFilters);
    setCurrentPage(1);
  };

  const handleQuickFilterChange = (filterId: string | null) => {
    setActiveQuickFilter(filterId);
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />

            {/* Navigation Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Button 
                onClick={() => setIsCreateModalOpen(true)} 
                className="gap-2"
                data-testid="button-post-rfp"
              >
                <PlusCircle className="h-4 w-4" />
                Post RFP
              </Button>
              <Button 
                onClick={() => setLocation('/dashboard/all')}
                variant="outline" 
                className="gap-2"
                data-testid="button-search-rfps"
              >
                <Search className="h-4 w-4" />
                Search RFPs
              </Button>
            </div>

            <div className="space-y-6 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">New RFPs</h2>
              </div>

              <SavedFilters
                currentFilters={searchFilters}
                onLoadFilters={handleFilterChange}
              />

              <QuickFilterChips
                activeFilter={activeQuickFilter}
                onFilterChange={handleQuickFilterChange}
              />

              <AdvancedSearch
                filters={searchFilters}
                onFiltersChange={handleFilterChange}
              />

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
                          <h4 className="mb-2 text-sm font-semibold">TRADE</h4>
                          <div className="space-y-2">
                            {TRADE_OPTIONS.map((trade) => (
                              <div key={trade} className="flex items-center space-x-2">
                                <Checkbox
                                  id={trade}
                                  checked={selectedFilters.includes(trade)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedFilters([...selectedFilters, trade]);
                                    } else {
                                      setSelectedFilters(selectedFilters.filter(f => f !== trade));
                                    }
                                    setCurrentPage(1);
                                  }}
                                  data-testid={`checkbox-${trade}`}
                                />
                                <Label htmlFor={trade} className="text-sm font-normal cursor-pointer">
                                  {trade}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 text-sm font-semibold">PROJECT SIZE</h4>
                          <div className="space-y-2">
                            {[
                              { value: "under100k", label: "Under $100,000" },
                              { value: "100k-500k", label: "$100,000 to $500,000" },
                              { value: "500k-1m", label: "$500,000 - $1 million" },
                              { value: "1m+", label: "$1 million+" }
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
                        isNew={newestRfpIds.has(rfp.id)}
                        from="dashboard-new"
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

      {/* Create RFP Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] sm:w-full mx-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New RFP</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-2 max-h-[70vh] pb-4">
            <RfpForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateModalOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}