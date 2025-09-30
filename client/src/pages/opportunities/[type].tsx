import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { RfpCard } from "@/components/rfp-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowUpDown } from "lucide-react";
import { isAfter, subHours, addDays, addMonths } from "date-fns";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OfflineIndicator, OfflineBanner } from "@/components/offline-status";
import { US_STATES_AND_TERRITORIES } from "@/lib/utils";
import { CERTIFICATIONS } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter } from "lucide-react";

const ITEMS_PER_PAGE = 16; // 4x4 grid

type SortOption = "none" | "priceAsc" | "priceDesc" | "deadline";

export default function OpportunitiesPage() {
  const { type } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("deadline");
  const [locationFilter, setLocationFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [certificationFilter, setCertificationFilter] = useState<string[]>([]);
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  
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

  // Apply budget filter
  if (budgetFilter && budgetFilter !== "all") {
    filteredRfps = filteredRfps.filter(rfp => {
      // Skip RFPs without any budget information
      if (rfp.budgetMin == null) return false;
      
      const budgetMin = rfp.budgetMin;
      
      switch (budgetFilter) {
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
  }

  // Apply certification filter
  if (certificationFilter.length > 0) {
    filteredRfps = filteredRfps.filter(rfp => {
      if (!rfp.certificationGoals || rfp.certificationGoals.length === 0) return false;
      return certificationFilter.some(cert => rfp.certificationGoals?.includes(cert));
    });
  }

  // Apply deadline filter
  if (deadlineFilter && deadlineFilter !== "all") {
    const now = new Date();
    filteredRfps = filteredRfps.filter(rfp => {
      const deadline = new Date(rfp.deadline);
      switch (deadlineFilter) {
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

  // Apply sorting
  filteredRfps = [...filteredRfps].sort((a, b) => {
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

  const totalPages = Math.ceil(filteredRfps.length / ITEMS_PER_PAGE);
  const displayedRfps = filteredRfps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Use predefined US states and territories for location filtering
  const locations = US_STATES_AND_TERRITORIES;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost">← Back to Home</Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {type === "featured" ? "Featured Opportunities" : "New Opportunities"}
          </h1>
          <OfflineIndicator />
        </div>
        
        {/* Display the offline banner when offline */}
        <OfflineBanner />

        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search opportunities..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                data-testid="input-search-opportunities"
              />
            </div>

            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[200px]" data-testid="select-sort">
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
              <SelectTrigger className="w-[200px]" data-testid="select-location">
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

          <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {displayedRfps.map((rfp) => (
                <RfpCard
                  key={rfp.id}
                  rfp={rfp}
                  compact
                  isNew={type === "new"}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-muted-foreground">
            No opportunities found matching your criteria.
          </p>
        )}
      </main>
    </div>
  );
}