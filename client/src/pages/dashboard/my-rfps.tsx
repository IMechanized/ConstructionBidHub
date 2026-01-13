import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RfpForm from "@/components/rfp-form";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { isAfter, subHours } from "date-fns";
import { RfpCard } from "@/components/rfp-card";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useTranslation } from "react-i18next";
import { AdvancedSearch, SearchFilter } from "@/components/advanced-search";
import { SavedFilters } from "@/components/saved-filters";
import { QuickFilterChips, QUICK_FILTERS } from "@/components/quick-filter-chips";

export default function MyRfpsPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  // Advanced search state
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user?.language);
    }
  }, [user?.language, i18n]);

  const breadcrumbItems = [
    {
      label: t('dashboard.dashboard'),
      href: "/dashboard",
    },
    {
      label: "My RFPs",
      href: "/dashboard/my-rfps",
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

  const applyFilters = (rfpList: Rfp[]) => {
    let filtered = rfpList;

    // Apply advanced search filters
    const locationFilters = searchFilters.filter(f => f.type === "location");
    const tradeFilters = searchFilters.filter(f => f.type === "trade");
    const certFilters = searchFilters.filter(f => f.type === "certification");

    if (locationFilters.length > 0) {
      filtered = filtered.filter(rfp =>
        locationFilters.some(f => rfp.jobState.toLowerCase().includes(f.value.toLowerCase()))
      );
    }

    if (tradeFilters.length > 0) {
      filtered = filtered.filter(rfp => {
        if (!rfp.desiredTrades || rfp.desiredTrades.length === 0) return false;
        return tradeFilters.some(f => rfp.desiredTrades?.includes(f.value));
      });
    }

    if (certFilters.length > 0) {
      filtered = filtered.filter(rfp => {
        if (!rfp.certificationGoals || rfp.certificationGoals.length === 0) return false;
        return certFilters.some(f => rfp.certificationGoals?.includes(f.value));
      });
    }

    // Apply quick filter if active
    if (activeQuickFilter) {
      const quickFilter = QUICK_FILTERS.find(f => f.id === activeQuickFilter);
      if (quickFilter) {
        filtered = filtered.filter(quickFilter.filterFn);
      }
    }

    // Sort by newest first (most recently created)
    filtered = [...filtered].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return filtered;
  };

  const filteredMyRfps = applyFilters(myRfps);
  const totalPages = Math.ceil(filteredMyRfps.length / itemsPerPage);
  const paginatedRfps = filteredMyRfps.slice(
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
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />

            <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold">My RFPs</h2>
                <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto min-h-[44px]" data-testid="button-create-rfp">
                  {t('dashboard.createRfp')}
                </Button>
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

              {loadingRfps ? (
                <DashboardSectionSkeleton count={9} />
              ) : (
                <>
                  {filteredMyRfps.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground text-sm sm:text-base">No RFPs found matching your filters.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {paginatedRfps.map((rfp) => (
                          <RfpCard
                            key={rfp.id}
                            rfp={rfp}
                            isNew={isAfter(new Date(rfp.createdAt), twentyFourHoursAgo)}
                            from="my-rfps"
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
