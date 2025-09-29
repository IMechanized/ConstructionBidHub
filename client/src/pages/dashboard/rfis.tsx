import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Rfi, type Rfp, type User } from "@shared/schema";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { DashboardSectionSkeleton } from "@/components/skeletons";
import { format } from "date-fns";
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
import { MessageSquare, ArrowLeft, Send, Inbox } from "lucide-react";
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

type RfiWithRfp = Rfi & { rfp: Rfp | null };

export default function RfiPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRfi, setSelectedRfi] = useState<(Rfi & { rfp: Rfp | null }) | null>(null);
  const [sentCurrentPage, setSentCurrentPage] = useState(1);
  const [receivedCurrentPage, setReceivedCurrentPage] = useState(1);
  const itemsPerPage = 6;

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
            ) : isLoading ? (
              <DashboardSectionSkeleton count={5} />
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
                  {(() => {
                    const totalPages = Math.ceil(sentRfis.length / itemsPerPage);
                    const startIndex = (sentCurrentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const currentRfis = sentRfis.slice(startIndex, endIndex);

                    return (
                      <>
                        {sentRfis.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            You haven't requested any information yet.
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
                  {(() => {
                    const totalPages = Math.ceil(receivedRfis.length / itemsPerPage);
                    const startIndex = (receivedCurrentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const currentRfis = receivedRfis.slice(startIndex, endIndex);

                    return (
                      <>
                        {receivedRfis.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No RFI requests on your RFPs yet.
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