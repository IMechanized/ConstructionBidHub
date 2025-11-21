import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { RfpCard } from "@/components/rfp-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowUpDown, Filter, Menu } from "lucide-react";
import { isAfter, subHours, addDays, addMonths } from "date-fns";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Footer } from "@/components/ui/footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OfflineIndicator, OfflineBanner } from "@/components/offline-status";
import { US_STATES_AND_TERRITORIES } from "@/lib/utils";
import { CERTIFICATIONS, TRADE_OPTIONS } from "@shared/schema";
import { AdvancedSearch, SearchFilter } from "@/components/advanced-search";
import { QuickFilterChips, QUICK_FILTERS } from "@/components/quick-filter-chips";
import { SavedFilters } from "@/components/saved-filters";

const ITEMS_PER_PAGE = 16; // 4x4 grid

type SortOption = "none" | "priceAsc" | "priceDesc" | "deadline";

export default function OpportunitiesPage() {
  const { type } = useParams();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["deadline"]);
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilter[]>([]);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  
  const { data: rfps, isLoading, error } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
    staleTime: 300000, // 5 minutes
    retry: 3,
  });

  const twentyFourHoursAgo = subHours(new Date(), 24);
  let filteredRfps = rfps?.filter(rfp => {
    if (type === "featured") {
      return rfp.featured;
    } else if (type === "new") {
      return !rfp.featured && isAfter(new Date(rfp.createdAt), twentyFourHoursAgo);
    }
    return false;
  }) || [];

  // Apply search filter
  if (searchTerm) {
    filteredRfps = filteredRfps.filter(rfp =>
      rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.jobStreet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.jobCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.jobState.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.jobZip.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Apply location filter
  if (locationFilter && locationFilter !== "all") {
    filteredRfps = filteredRfps.filter(rfp =>
      rfp.jobState.toLowerCase().includes(locationFilter.toLowerCase())
    );
  }

  // Apply multi-select filters
  const budgetFilters = ["under100k", "100k-500k", "500k-1m", "1m+"];
  const deadlineFilters = ["next7days", "next30days", "next3months"];
  const tradeFilters = TRADE_OPTIONS;
  
  const selectedBudgets = selectedFilters.filter(f => budgetFilters.includes(f));
  const selectedCerts = selectedFilters.filter(f => CERTIFICATIONS.includes(f));
  const selectedDeadlines = selectedFilters.filter(f => deadlineFilters.includes(f));
  const selectedTrades = selectedFilters.filter(f => tradeFilters.includes(f));
  
  // Apply budget filters (OR within category)
  if (selectedBudgets.length > 0) {
    filteredRfps = filteredRfps.filter(rfp => {
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
    filteredRfps = filteredRfps.filter(rfp => {
      if (!rfp.certificationGoals || rfp.certificationGoals.length === 0) return false;
      return selectedCerts.some(cert => rfp.certificationGoals.includes(cert));
    });
  }
  
  // Apply trade filters (OR within category)
  if (selectedTrades.length > 0) {
    filteredRfps = filteredRfps.filter(rfp => {
      if (!rfp.desiredTrades || rfp.desiredTrades.length === 0) return false;
      return selectedTrades.some(trade => rfp.desiredTrades.includes(trade));
    });
  }
  
  // Apply deadline filters (OR within category)
  if (selectedDeadlines.length > 0) {
    const now = new Date();
    filteredRfps = filteredRfps.filter(rfp => {
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

  // Apply advanced filters from AdvancedSearch component
  if (advancedFilters.length > 0) {
    advancedFilters.forEach(filter => {
      switch (filter.type) {
        case "location":
          filteredRfps = filteredRfps.filter(rfp =>
            rfp.jobState.toLowerCase().includes(filter.value.toLowerCase())
          );
          break;
        case "trade":
          filteredRfps = filteredRfps.filter(rfp =>
            rfp.desiredTrades?.includes(filter.value)
          );
          break;
        case "certification":
          filteredRfps = filteredRfps.filter(rfp =>
            rfp.certificationGoals?.includes(filter.value)
          );
          break;
      }
    });
  }

  // Apply quick filter
  if (quickFilter) {
    const filter = QUICK_FILTERS.find(f => f.id === quickFilter);
    if (filter) {
      filteredRfps = filteredRfps.filter(filter.filterFn);
    }
  }

  // Apply sorting
  const sortOptions = ["priceAsc", "priceDesc", "deadline"];
  const activeSort = selectedFilters.find(f => sortOptions.includes(f)) || "deadline";
  
  filteredRfps = [...filteredRfps].sort((a, b) => {
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

  const totalPages = Math.ceil(filteredRfps.length / ITEMS_PER_PAGE);
  const displayedRfps = filteredRfps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Use predefined US states and territories for location filtering
  const locations = US_STATES_AND_TERRITORIES;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Logo className="h-12 md:h-16" />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Support
            </Link>
            <ThemeToggle size="sm" />
            <Button asChild variant="outline" size="sm" className="text-base">
              {user ? (
                <Link href="/dashboard">Dashboard</Link>
              ) : (
                <Link href="/auth">Get Started</Link>
              )}
            </Button>
          </div>

          {/* Mobile Navigation - Hamburger Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col h-full pt-6">
                  <div className="space-y-4 flex-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base"
                      asChild
                    >
                      <Link href="/support">Support</Link>
                    </Button>
                    
                    <div className="flex items-center justify-between px-3">
                      <span className="text-sm font-medium">Theme</span>
                      <ThemeToggle size="sm" />
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full text-base"
                      asChild
                    >
                      {user ? (
                        <Link href="/dashboard">Dashboard</Link>
                      ) : (
                        <Link href="/auth">Get Started</Link>
                      )}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-6 md:mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-9">← Back</Button>
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            {type === "featured" ? "Featured Opportunities" : "New Opportunities"}
          </h1>
          <OfflineIndicator />
        </div>
        
        {/* Display the offline banner when offline */}
        <OfflineBanner />

        <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
          {/* Quick filter chips */}
          <QuickFilterChips
            activeFilter={quickFilter}
            onFilterChange={(filterId) => {
              setQuickFilter(filterId);
              setCurrentPage(1);
            }}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search opportunities..."
                className="pl-10 h-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                data-testid="input-search-opportunities"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[180px] justify-between h-10" data-testid="button-filter">
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
              <SelectTrigger className="w-full sm:w-[180px] h-10" data-testid="select-location">
                <SelectValue placeholder="Location" />
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

          {/* Advanced Search and Saved Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
            <div className="flex-1 w-full">
              <AdvancedSearch
                filters={advancedFilters}
                onFiltersChange={(filters) => {
                  setAdvancedFilters(filters);
                  setCurrentPage(1);
                }}
              />
            </div>
            <SavedFilters
              currentFilters={advancedFilters}
              onLoadFilters={(filters) => {
                setAdvancedFilters(filters);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 border rounded-lg bg-background">
            <p className="text-center text-muted-foreground">
              Unable to load opportunities. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : displayedRfps.length > 0 ? (
          <>
            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedRfps.map((rfp) => (
                <RfpCard
                  key={rfp.id}
                  rfp={rfp}
                  compact
                  isNew={type === "new"}
                  from={type as string}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 md:mt-8 flex justify-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-muted-foreground text-sm md:text-base px-4">
            No opportunities found matching your criteria.
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}