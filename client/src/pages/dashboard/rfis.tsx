import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Rfi, type Rfp, type User } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { format, isWithinInterval, subDays, startOfDay, endOfDay } from "date-fns";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft, Send, Inbox, Search, Filter, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { RfiConversation } from "@/components/rfi-conversation";
import { Input } from "@/components/ui/input";
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

type RfiWithRfp = Rfi & { rfp: Rfp | null };

export default function RfiPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRfi, setSelectedRfi] = useState<(Rfi & { rfp: Rfp | null }) | null>(null);
  const [sentCurrentPage, setSentCurrentPage] = useState(1);
  const [receivedCurrentPage, setReceivedCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter and search state
  const [sentSearchTerm, setSentSearchTerm] = useState("");
  const [sentStatusFilter, setSentStatusFilter] = useState<string>("all");
  const [sentDateFilter, setSentDateFilter] = useState<string>("all");
  const [receivedSearchTerm, setReceivedSearchTerm] = useState("");
  const [receivedStatusFilter, setReceivedStatusFilter] = useState<string>("all");
  const [receivedDateFilter, setReceivedDateFilter] = useState<string>("all");

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "RFIs",
      href: "/dashboard/rfis",
    },
  ];

  // Get RFIs user sent out
  const { data: sentRfis = [], isLoading: sentLoading, error: sentError } = useQuery<RfiWithRfp[]>({
    queryKey: ["/api/rfis"],
    retry: 2,
    staleTime: 30000,
  });

  // Get RFIs user received on their RFPs
  const { data: receivedRfis = [], isLoading: receivedLoading, error: receivedError } = useQuery<RfiWithRfp[]>({
    queryKey: ["/api/rfis/received"],
    retry: 2,
    staleTime: 30000,
  });

  const isLoading = sentLoading || receivedLoading;
  const error = sentError || receivedError;

  // Handle unauthorized access
  useEffect(() => {
    if (error instanceof Error && error.message.includes("401")) {
      setLocation("/auth");
      toast({
        title: "Authentication Required",
        description: "Please sign in to view your RFIs",
        variant: "destructive",
      });
    }
  }, [error, setLocation, toast]);

  // Filter function
  const filterRfis = (rfis: RfiWithRfp[], searchTerm: string, statusFilter: string, dateFilter: string) => {
    return rfis.filter(rfi => {
      // Search filter
      const matchesSearch = !searchTerm || 
        rfi.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfi.rfp?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfi.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || rfi.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== "all") {
        const rfiDate = new Date(rfi.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case "today":
            matchesDate = isWithinInterval(rfiDate, {
              start: startOfDay(now),
              end: endOfDay(now)
            });
            break;
          case "week":
            matchesDate = isWithinInterval(rfiDate, {
              start: subDays(now, 7),
              end: now
            });
            break;
          case "month":
            matchesDate = isWithinInterval(rfiDate, {
              start: subDays(now, 30),
              end: now
            });
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  // Apply filters
  const filteredSentRfis = filterRfis(sentRfis, sentSearchTerm, sentStatusFilter, sentDateFilter);
  const filteredReceivedRfis = filterRfis(receivedRfis, receivedSearchTerm, receivedStatusFilter, receivedDateFilter);

  // Clear all filters
  const clearSentFilters = () => {
    setSentSearchTerm("");
    setSentStatusFilter("all");
    setSentDateFilter("all");
  };

  const clearReceivedFilters = () => {
    setReceivedSearchTerm("");
    setReceivedStatusFilter("all");
    setReceivedDateFilter("all");
  };

  const hasActiveSentFilters = sentSearchTerm || sentStatusFilter !== "all" || sentDateFilter !== "all";
  const hasActiveReceivedFilters = receivedSearchTerm || receivedStatusFilter !== "all" || receivedDateFilter !== "all";

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <main className="md:ml-[280px] min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl mt-20 md:mt-0">
          <BreadcrumbNav items={breadcrumbItems} />

          <div className="space-y-6 mt-4">
            <div className="flex items-center gap-4">
              {selectedRfi && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRfi(null)}
                  data-testid="back-to-rfi-list-button"
                  className="px-2 sm:px-3"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to RFIs</span>
                  <span className="sm:hidden text-xs ml-1">Back</span>
                </Button>
              )}
              <h1 className="text-2xl font-bold">
                {selectedRfi ? "RFI Conversation" : "RFIs"}
              </h1>
            </div>

            {selectedRfi ? (
              <RfiConversation
                rfi={selectedRfi as Rfi & { organization?: User }}
                onClose={() => setSelectedRfi(null)}
              />
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Failed to load RFIs. Please try again.
              </div>
            ) : (
              <Tabs defaultValue="my-rfis" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="my-rfis" 
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                    data-testid="my-rfis-tab"
                  >
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline sm:inline">My RFIs</span>
                    <span className="xs:hidden sm:hidden">RFIs</span>
                    <Badge variant="outline" className="text-xs">{sentRfis.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="rfi-requests" 
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                    data-testid="rfi-requests-tab"
                  >
                    <Inbox className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline sm:inline">RFI Requests</span>
                    <span className="xs:hidden sm:hidden">Requests</span>
                    <Badge variant="outline" className="text-xs">{receivedRfis.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="my-rfis" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Filter & Search</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by message, RFP title, or email..."
                              value={sentSearchTerm}
                              onChange={(e) => setSentSearchTerm(e.target.value)}
                              className="pl-10"
                              data-testid="sent-rfis-search"
                            />
                          </div>
                        </div>
                        <Select value={sentStatusFilter} onValueChange={setSentStatusFilter}>
                          <SelectTrigger className="w-full md:w-[180px]" data-testid="sent-status-filter">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="responded">Responded</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={sentDateFilter} onValueChange={setSentDateFilter}>
                          <SelectTrigger className="w-full md:w-[180px]" data-testid="sent-date-filter">
                            <SelectValue placeholder="Filter by date" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">Last 30 Days</SelectItem>
                          </SelectContent>
                        </Select>
                        {hasActiveSentFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSentFilters}
                            className="gap-2"
                            data-testid="clear-sent-filters"
                          >
                            <X className="h-4 w-4" />
                            Clear
                          </Button>
                        )}
                      </div>
                      {hasActiveSentFilters && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Showing {filteredSentRfis.length} of {sentRfis.length} RFIs
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {(() => {
                    const totalPages = Math.ceil(filteredSentRfis.length / itemsPerPage);
                    const startIndex = (sentCurrentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const currentRfis = filteredSentRfis.slice(startIndex, endIndex);

                    return (
                      <>
                        {filteredSentRfis.length === 0 && !sentLoading ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {hasActiveSentFilters 
                              ? "No RFIs match your filters."
                              : "You haven't requested any information yet."}
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                              <div className="inline-block min-w-full align-middle">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[140px] sm:w-[200px]">RFP Title</TableHead>
                                      <TableHead className="hidden md:table-cell max-w-[200px]">Message</TableHead>
                                      <TableHead className="hidden sm:table-cell w-[120px]">Date</TableHead>
                                      <TableHead className="w-[80px] sm:w-[100px]">Status</TableHead>
                                      <TableHead className="text-right w-[80px] sm:w-[120px]">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {currentRfis.map((rfi: RfiWithRfp) => (
                                      <TableRow key={rfi.id} data-testid={`sent-rfi-row-${rfi.id}`}>
                                        <TableCell className="font-medium">
                                          <div className="truncate max-w-[140px] sm:max-w-[200px]">
                                            {rfi.rfp?.title || "Unknown RFP"}
                                          </div>
                                          {/* Show message and date on mobile as subtitle */}
                                          <div className="md:hidden text-xs text-muted-foreground mt-1">
                                            <div className="truncate max-w-[140px]">{rfi.message}</div>
                                            <div className="sm:hidden mt-1">{format(new Date(rfi.createdAt), "PP")}</div>
                                          </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell max-w-[200px]">
                                          <p className="truncate">{rfi.message}</p>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell whitespace-nowrap">
                                          <div className="hidden sm:block md:hidden">{format(new Date(rfi.createdAt), "PP")}</div>
                                          <div className="hidden md:block">{format(new Date(rfi.createdAt), "PPp")}</div>
                                        </TableCell>
                                        <TableCell>
                                          <Badge 
                                            variant={rfi.status === "responded" ? "default" : "secondary"}
                                            className="capitalize text-xs"
                                          >
                                            {rfi.status || "pending"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedRfi(rfi)}
                                            data-testid={`view-conversation-${rfi.id}`}
                                            className="h-8 px-2 sm:px-3"
                                          >
                                            <MessageSquare className="h-4 w-4 sm:mr-1" />
                                            <span className="hidden sm:inline ml-1">View Chat</span>
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>

                            {totalPages > 1 && (
                              <Pagination>
                                <PaginationContent className="flex flex-wrap justify-center gap-1">
                                  <PaginationItem>
                                    <PaginationPrevious 
                                      onClick={() => setSentCurrentPage(p => Math.max(1, p - 1))}
                                      className={`${sentCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                                    />
                                  </PaginationItem>
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <PaginationItem key={page}>
                                      <PaginationLink
                                        onClick={() => setSentCurrentPage(page)}
                                        isActive={sentCurrentPage === page}
                                        className="cursor-pointer"
                                      >
                                        {page}
                                      </PaginationLink>
                                    </PaginationItem>
                                  ))}
                                  <PaginationItem>
                                    <PaginationNext
                                      onClick={() => setSentCurrentPage(p => Math.min(totalPages, p + 1))}
                                      className={`${sentCurrentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()
                  }
                </TabsContent>

                <TabsContent value="rfi-requests" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Filter & Search</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by message, RFP title, or email..."
                              value={receivedSearchTerm}
                              onChange={(e) => setReceivedSearchTerm(e.target.value)}
                              className="pl-10"
                              data-testid="received-rfis-search"
                            />
                          </div>
                        </div>
                        <Select value={receivedStatusFilter} onValueChange={setReceivedStatusFilter}>
                          <SelectTrigger className="w-full md:w-[180px]" data-testid="received-status-filter">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="responded">Responded</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={receivedDateFilter} onValueChange={setReceivedDateFilter}>
                          <SelectTrigger className="w-full md:w-[180px]" data-testid="received-date-filter">
                            <SelectValue placeholder="Filter by date" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">Last 30 Days</SelectItem>
                          </SelectContent>
                        </Select>
                        {hasActiveReceivedFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearReceivedFilters}
                            className="gap-2"
                            data-testid="clear-received-filters"
                          >
                            <X className="h-4 w-4" />
                            Clear
                          </Button>
                        )}
                      </div>
                      {hasActiveReceivedFilters && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Showing {filteredReceivedRfis.length} of {receivedRfis.length} RFIs
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {(() => {
                    const totalPages = Math.ceil(filteredReceivedRfis.length / itemsPerPage);
                    const startIndex = (receivedCurrentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const currentRfis = filteredReceivedRfis.slice(startIndex, endIndex);

                    return (
                      <>
                        {filteredReceivedRfis.length === 0 && !receivedLoading ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {hasActiveReceivedFilters
                              ? "No RFIs match your filters."
                              : "No RFI requests on your RFPs yet."}
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                              <div className="inline-block min-w-full align-middle">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[140px] sm:w-[200px]">RFP Title</TableHead>
                                      <TableHead className="hidden lg:table-cell max-w-[180px]">Message</TableHead>
                                      <TableHead className="hidden md:table-cell w-[120px]">From</TableHead>
                                      <TableHead className="hidden sm:table-cell w-[120px]">Date</TableHead>
                                      <TableHead className="w-[80px] sm:w-[100px]">Status</TableHead>
                                      <TableHead className="text-right w-[80px] sm:w-[120px]">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {currentRfis.map((rfi: RfiWithRfp) => (
                                      <TableRow key={`received-${rfi.id}`} data-testid={`received-rfi-row-${rfi.id}`}>
                                        <TableCell className="font-medium">
                                          <div className="truncate max-w-[140px] sm:max-w-[200px]">
                                            {rfi.rfp?.title || "Unknown RFP"}
                                          </div>
                                          {/* Show message, from, and date on mobile as subtitle */}
                                          <div className="lg:hidden text-xs text-muted-foreground mt-1 space-y-1">
                                            <div className="truncate max-w-[140px]">{rfi.message}</div>
                                            <div className="md:hidden text-muted-foreground">
                                              From: {rfi.email}
                                            </div>
                                            <div className="sm:hidden">{format(new Date(rfi.createdAt), "PP")}</div>
                                          </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell max-w-[180px]">
                                          <p className="truncate">{rfi.message}</p>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                          <div className="truncate max-w-[120px]">{rfi.email}</div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell whitespace-nowrap">
                                          <div className="hidden sm:block md:hidden">{format(new Date(rfi.createdAt), "PP")}</div>
                                          <div className="hidden md:block">{format(new Date(rfi.createdAt), "PPp")}</div>
                                        </TableCell>
                                        <TableCell>
                                          <Badge 
                                            variant={rfi.status === "responded" ? "default" : "secondary"}
                                            className="capitalize text-xs"
                                          >
                                            {rfi.status || "pending"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedRfi(rfi)}
                                            data-testid={`view-received-conversation-${rfi.id}`}
                                            className="h-8 px-2 sm:px-3"
                                          >
                                            <MessageSquare className="h-4 w-4 sm:mr-1" />
                                            <span className="hidden sm:inline ml-1">View Chat</span>
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>

                            {totalPages > 1 && (
                              <Pagination>
                                <PaginationContent className="flex flex-wrap justify-center gap-1">
                                  <PaginationItem>
                                    <PaginationPrevious 
                                      onClick={() => setReceivedCurrentPage(p => Math.max(1, p - 1))}
                                      className={`${receivedCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                                    />
                                  </PaginationItem>
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <PaginationItem key={page}>
                                      <PaginationLink
                                        onClick={() => setReceivedCurrentPage(page)}
                                        isActive={receivedCurrentPage === page}
                                        className="cursor-pointer"
                                      >
                                        {page}
                                      </PaginationLink>
                                    </PaginationItem>
                                  ))}
                                  <PaginationItem>
                                    <PaginationNext
                                      onClick={() => setReceivedCurrentPage(p => Math.min(totalPages, p + 1))}
                                      className={`${receivedCurrentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()
                  }
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}