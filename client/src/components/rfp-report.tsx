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
  const itemsPerPage = 10; 
  const totalPages = Math.ceil(rfps.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRfps = rfps.slice(startIndex, endIndex);

  return (
    <Card className="w-full">
      <div className="relative overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead className="hidden sm:table-cell">Location</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              <TableHead className="w-[120px]">Budget</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRfps.map((rfp) => (
              <TableRow key={rfp.id}>
                <TableCell className="font-medium">
                  {rfp.title}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {rfp.jobLocation}
                </TableCell>
                <TableCell className="hidden md:table-cell whitespace-nowrap">
                  {format(new Date(rfp.deadline), "PP")}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  ${rfp.budgetMin?.toLocaleString() || "N/A"}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/reports/${rfp.id}`)}
                    className="w-full whitespace-nowrap"
                    size="sm"
                  >
                    View Report
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {currentRfps.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No RFPs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="py-4 border-t">
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
        </div>
      )}
    </Card>
  );
}