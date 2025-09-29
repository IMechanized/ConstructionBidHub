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
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to RFIs
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
                    className="flex items-center gap-2"
                    data-testid="my-rfis-tab"
                  >
                    <Send className="h-4 w-4" />
                    My RFIs
                    <Badge variant="outline">{sentRfis.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="rfi-requests" 
                    className="flex items-center gap-2"
                    data-testid="rfi-requests-tab"
                  >
                    <Inbox className="h-4 w-4" />
                    RFI Requests
                    <Badge variant="outline">{receivedRfis.length}</Badge>
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
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>RFP Title</TableHead>
                                  <TableHead>Message</TableHead>
                                  <TableHead>Submitted Date</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {currentRfis.map((rfi: RfiWithRfp) => (
                                  <TableRow key={rfi.id} data-testid={`sent-rfi-row-${rfi.id}`}>
                                    <TableCell className="font-medium">
                                      {rfi.rfp?.title || "Unknown RFP"}
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                      <p className="truncate">{rfi.message}</p>
                                    </TableCell>
                                    <TableCell>
                                      {format(new Date(rfi.createdAt), "PPp")}
                                    </TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant={rfi.status === "responded" ? "default" : "secondary"}
                                        className="capitalize"
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
                                      >
                                        <MessageSquare className="h-4 w-4 mr-1" />
                                        View Chat
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>

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
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>RFP Title</TableHead>
                                  <TableHead>Message</TableHead>
                                  <TableHead>From</TableHead>
                                  <TableHead>Submitted Date</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {currentRfis.map((rfi: RfiWithRfp) => (
                                  <TableRow key={`received-${rfi.id}`} data-testid={`received-rfi-row-${rfi.id}`}>
                                    <TableCell className="font-medium">
                                      {rfi.rfp?.title || "Unknown RFP"}
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                      <p className="truncate">{rfi.message}</p>
                                    </TableCell>
                                    <TableCell>
                                      {rfi.email}
                                    </TableCell>
                                    <TableCell>
                                      {format(new Date(rfi.createdAt), "PPp")}
                                    </TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant={rfi.status === "responded" ? "default" : "secondary"}
                                        className="capitalize"
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
                                      >
                                        <MessageSquare className="h-4 w-4 mr-1" />
                                        View Chat
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>

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