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
import { format } from "date-fns";
import { Card } from "@/components/ui/card";

interface RfpReportProps {
  rfps: Rfp[];
}

export default function RfpReport({ rfps }: RfpReportProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(rfps.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRfps = rfps.slice(startIndex, endIndex);

  const { data: rfis } = useQuery<Rfi[]>({
    queryKey: ["/api/rfis"],
  });

  return (
    <div className="space-y-6">
      {currentRfps.map((rfp) => {
        const rfpRfis = rfis?.filter((rfi) => rfi.rfpId === rfp.id) || [];
        
        return (
          <Card key={rfp.id} className="p-6">
            <h3 className="text-2xl font-bold mb-4">{rfp.title}</h3>
            <div className="mb-4">
              <p><strong>Location:</strong> {rfp.jobLocation}</p>
              <p><strong>Due Date:</strong> {format(new Date(rfp.deadline), "PPp")}</p>
              <p><strong>Budget:</strong> ${rfp.budgetMin?.toLocaleString() || "Not specified"}</p>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">Bidders Information</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfpRfis.map((rfi) => (
                    <TableRow key={rfi.id}>
                      <TableCell>{rfi.email}</TableCell>
                      <TableCell>{rfi.email}</TableCell>
                      <TableCell>{format(new Date(rfi.createdAt), "PP")}</TableCell>
                      <TableCell className="capitalize">{rfi.status}</TableCell>
                    </TableRow>
                  ))}
                  {rfpRfis.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">No bids received yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-2">Additional Information</h4>
              <p><strong>Walkthrough Date:</strong> {format(new Date(rfp.walkthroughDate), "PP")}</p>
              <p><strong>RFI Due Date:</strong> {format(new Date(rfp.rfiDate), "PP")}</p>
              {rfp.certificationGoals && (
                <p><strong>Certification Goals:</strong> {rfp.certificationGoals}</p>
              )}
            </div>
          </Card>
        );
      })}

      <Pagination>
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
    </div>
  );
}
