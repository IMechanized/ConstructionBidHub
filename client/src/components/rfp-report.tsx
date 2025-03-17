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
import { ChevronDown, ChevronUp, Building2, Mail, Phone, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold">RFI Submissions</h4>
                            <Badge variant="secondary">
                              {rfis?.length || 0} Submissions
                            </Badge>
                          </div>
                          {rfis && rfis.length > 0 ? (
                            <div className="space-y-4">
                              {rfis.map((rfi) => (
                                <div 
                                  key={rfi.id}
                                  className="bg-background rounded-lg border p-4 space-y-3"
                                >
                                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{rfi.companyName || 'Company Name Not Provided'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{rfi.email}</span>
                                      </div>
                                      {rfi.phone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <span>{rfi.phone}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <Badge 
                                        variant={rfi.status === 'pending' ? 'secondary' : 
                                                rfi.status === 'approved' ? 'success' : 'destructive'}
                                      >
                                        {rfi.status}
                                      </Badge>
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>{format(new Date(rfi.createdAt), "PPp")}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-muted/30 rounded p-3">
                                    <h5 className="font-medium mb-2">Message/Questions:</h5>
                                    <p className="text-sm whitespace-pre-wrap">{rfi.message}</p>
                                  </div>
                                  {rfi.attachments && rfi.attachments.length > 0 && (
                                    <div className="pt-2">
                                      <h5 className="font-medium mb-2">Attachments:</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {rfi.attachments.map((attachment, index) => (
                                          <a
                                            key={index}
                                            href={attachment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline"
                                          >
                                            Attachment {index + 1}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
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