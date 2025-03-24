import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { RfpCard } from "@/components/rfp-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowUpDown, WifiOff } from "lucide-react";
import { isAfter, subHours } from "date-fns";
import { Link } from "wouter";
import { useOffline, handleOfflineFetch } from "@/hooks/use-offline";
import { OfflineBanner, OfflineIndicator } from "@/components/offline-status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 16; // 4x4 grid

type SortOption = "none" | "priceAsc" | "priceDesc" | "deadline";

export default function OpportunitiesPage() {
  const { type } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("none");
  const [locationFilter, setLocationFilter] = useState("all"); // Changed from empty string to "all"
  const { isOffline } = useOffline();
  
  const { data: rfps, isLoading, error } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
    staleTime: isOffline ? Infinity : 300000, // 5 minutes (use cached data indefinitely when offline)
    retry: isOffline ? false : 3, // Don't retry when offline
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
      rfp.jobLocation.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Apply location filter
  if (locationFilter && locationFilter !== "all") { // Updated filter logic
    filteredRfps = filteredRfps.filter(rfp =>
      rfp.jobLocation.toLowerCase().includes(locationFilter.toLowerCase())
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

  // Get unique locations for the location filter dropdown
  const locations = Array.from(new Set(rfps?.map(rfp => rfp.jobLocation) || [])).sort();

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
            {isOffline ? (
              <>
                <WifiOff className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">Limited data available offline</h3>
                <p className="text-center text-muted-foreground max-w-md">
                  You're viewing cached data while offline. Some content may be unavailable until you reconnect.
                </p>
              </>
            ) : (
              <>
                <p className="text-center text-muted-foreground">
                  Unable to load opportunities. Please try again later.
                </p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </>
            )}
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
                  disabled={currentPage === totalPages || isOffline} // Disable in offline mode
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-muted-foreground">
            {isOffline 
              ? "Limited data available while offline. Some opportunities may not be displayed."
              : "No opportunities found matching your criteria."
            }
          </p>
        )}
      </main>
    </div>
  );
}