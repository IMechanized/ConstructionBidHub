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
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Location</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRfps.map((rfp) => (
              <TableRow key={rfp.id}>
                <TableCell className="font-medium">{rfp.title}</TableCell>
                <TableCell className="hidden sm:table-cell">{rfp.jobLocation}</TableCell>
                <TableCell className="hidden md:table-cell">{format(new Date(rfp.deadline), "PPp")}</TableCell>
                <TableCell>${rfp.budgetMin?.toLocaleString() || "Not specified"}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/reports/${rfp.id}`)}
                    className="w-full sm:w-auto"
                  >
                    View Full Report
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent className="flex-wrap justify-center gap-2">
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