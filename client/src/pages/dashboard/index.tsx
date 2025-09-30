import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import RfpForm from "@/components/rfp-form";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { isAfter, subHours, addDays, addMonths } from "date-fns";
import { RfpCard } from "@/components/rfp-card";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useTranslation } from "react-i18next";
import { US_STATES_AND_TERRITORIES } from "@/lib/utils";
import { CERTIFICATIONS } from "@shared/schema";

type SortOption = "none" | "priceAsc" | "priceDesc" | "deadline";

export default function Dashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [consolidatedFilter, setConsolidatedFilter] = useState("deadline");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Set language from user preference
  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);

  const breadcrumbItems = [
    {
      label: t('dashboard.dashboard'),
      href: "/dashboard",
    },
  ];

  const { data: rfps, isLoading: loadingRfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const twentyFourHoursAgo = subHours(new Date(), 24);
  const myRfps = rfps?.filter((rfp) => rfp.organizationId === user?.id) || [];

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  const locations = US_STATES_AND_TERRITORIES;

  const applyFilters = (rfpList: Rfp[]) => {
    let filtered = rfpList;

    if (searchTerm) {
      filtered = filtered.filter(
        (rfp) =>
          rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfp.jobStreet.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfp.jobCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rfp.jobState.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (locationFilter && locationFilter !== "all") {
      filtered = filtered.filter((rfp) =>
        rfp.jobState.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Apply consolidated filter (budget, certification, or deadline range)
    const budgetFilters = ["under50k", "50k-100k", "100k-250k", "250k-500k", "500k+"];
    const deadlineFilters = ["next7days", "next30days", "next3months"];
    
    if (budgetFilters.includes(consolidatedFilter)) {
      filtered = filtered.filter(rfp => {
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
      filtered = filtered.filter(rfp => {
        if (!rfp.certificationGoals || rfp.certificationGoals.length === 0) return false;
        return rfp.certificationGoals.includes(consolidatedFilter);
      });
    } else if (deadlineFilters.includes(consolidatedFilter)) {
      const now = new Date();
      filtered = filtered.filter(rfp => {
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
    filtered = [...filtered].sort((a, b) => {
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
          <div className="container mx-auto p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />

            <div className="space-y-6 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">{t('dashboard.myRfps')}</h2>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  {t('dashboard.createRfp')}
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    placeholder={t('dashboard.searchRfps')}
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
                      <SelectValue placeholder={t('dashboard.filterByLocation')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('dashboard.allLocations')}</SelectItem>
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
        <DialogContent className="sm:max-w-[600px] w-[95vw] sm:w-full mx-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('dashboard.createNewRfp')}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-2 max-h-[70vh] pb-4">
            <RfpForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateModalOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}