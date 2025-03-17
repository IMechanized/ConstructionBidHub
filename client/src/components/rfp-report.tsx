import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp, Rfi } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { ChevronDown, ChevronUp } from "lucide-react";

interface RfpReportProps {
  rfps: Rfp[];
}

export default function RfpReport({ rfps }: RfpReportProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRfp, setExpandedRfp] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const itemsPerPage = 5;
  const totalPages = Math.ceil(rfps.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRfps = rfps.slice(startIndex, endIndex);

  // Query RFIs for the expanded RFP using the specific endpoint
  const { data: rfis } = useQuery<Rfi[]>({
    queryKey: ["/api/rfps", expandedRfp, "rfis"],
    queryFn: async () => {
      if (!expandedRfp) return [];
      const res = await fetch(`/api/rfps/${expandedRfp}/rfi`);
      if (!res.ok) throw new Error('Failed to fetch RFIs');
      return res.json();
    },
    enabled: expandedRfp !== null,
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] min-w-[200px]">Title</TableHead>
                <TableHead className="hidden sm:table-cell">Location</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead>
                <TableHead className="w-[100px]">Budget</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRfps.map((rfp) => (
                <>
                  <TableRow key={rfp.id}>
                    <TableCell className="font-medium truncate max-w-[200px]">
                      {rfp.title}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell truncate max-w-[150px]">
                      {rfp.jobLocation}
                    </TableCell>
                    <TableCell className="hidden md:table-cell whitespace-nowrap">
                      {format(new Date(rfp.deadline), "PP")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      ${rfp.budgetMin?.toLocaleString() || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/reports/${rfp.id}`)}
                          className="whitespace-nowrap"
                          size="sm"
                        >
                          View Report
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedRfp(expandedRfp === rfp.id ? null : rfp.id)}
                        >
                          {expandedRfp === rfp.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRfp === rfp.id && (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <div className="bg-muted/50 p-4">
                          <h4 className="font-semibold mb-2">RFI Submissions</h4>
                          {rfis && rfis.length > 0 ? (
                            <div className="space-y-3">
                              {rfis.map((rfi) => (
                                <div 
                                  key={rfi.id}
                                  className="bg-background rounded p-3 space-y-2"
                                >
                                  <div className="flex justify-between">
                                    <span className="font-medium">{rfi.email}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(rfi.createdAt), "PP")}
                                    </span>
                                  </div>
                                  <p className="text-sm">{rfi.message}</p>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Status:</span>
                                    <span className="text-sm font-medium capitalize">{rfi.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No RFI submissions yet.</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
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
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
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
                className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}