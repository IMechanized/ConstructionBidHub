import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { RfpCard } from "@/components/rfp-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowUpDown } from "lucide-react";
import { isAfter, subHours } from "date-fns";
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

const ITEMS_PER_PAGE = 16; // 4x4 grid

type SortOption = "none" | "priceAsc" | "priceDesc" | "deadline";

export default function OpportunitiesPage() {
  const { type } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("deadline");
  const [locationFilter, setLocationFilter] = useState("all");
  
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
  if (locationFilter && locationFilter !== "all") { // Updated filter logic
    filteredRfps = filteredRfps.filter(rfp =>
      rfp.jobState.toLowerCase().includes(locationFilter.toLowerCase())
    );
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
              />
            </div>

            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[200px]">
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
              onValueChange={setLocationFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem> {/* Changed from empty string to "all" */}
                {locations.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
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