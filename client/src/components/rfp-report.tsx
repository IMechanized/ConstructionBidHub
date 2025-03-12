import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
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
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface RfpReportProps {
  rfps: Rfp[];
}

export default function RfpReport({ rfps }: RfpReportProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [, navigate] = useLocation();
  const itemsPerPage = 5;
  const totalPages = Math.ceil(rfps.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRfps = rfps.slice(startIndex, endIndex);

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs">Title</TableHead>
            <TableHead className="text-xs">Location</TableHead>
            <TableHead className="text-xs">Due Date</TableHead>
            <TableHead className="text-xs">Budget</TableHead>
            <TableHead className="text-xs text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentRfps.map((rfp) => (
            <TableRow key={rfp.id} className="hover:bg-muted/50">
              <TableCell className="py-2 text-xs">{rfp.title}</TableCell>
              <TableCell className="py-2 text-xs">{rfp.jobLocation}</TableCell>
              <TableCell className="py-2 text-xs">{format(new Date(rfp.deadline), "PP")}</TableCell>
              <TableCell className="py-2 text-xs">${rfp.budgetMin?.toLocaleString() || "N/A"}</TableCell>
              <TableCell className="py-2 text-xs text-right">
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => navigate(`/reports/${rfp.id}`)}
                >
                  View Report
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={`h-8 min-w-8 px-2 ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
                className="h-8 min-w-8 text-xs cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={`h-8 min-w-8 px-2 ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}