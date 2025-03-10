import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Rfp, Rfi } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
import html2pdf from 'html2pdf.js';

export default function DetailedReportPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: rfp, isLoading: loadingRfp } = useQuery<Rfp>({
    queryKey: [`/api/rfps/${id}`],
  });

  const { data: rfis } = useQuery<Rfi[]>({
    queryKey: ["/api/rfis"],
  });

  const rfpRfis = rfis?.filter((rfi) => rfi.rfpId === Number(id)) || [];

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Reports",
      href: "/dashboard?tab=reports",
    },
    {
      label: rfp?.title || "Report Details",
      href: `/reports/${id}`,
    },
  ];

  // Function to handle PDF download
  const handleDownload = () => {
    const element = document.getElementById('report-content');
    const opt = {
      margin: 1,
      filename: `${rfp?.title}-report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  if (loadingRfp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (!rfp || rfp.organizationId !== user?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Report not found or unauthorized access</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <BreadcrumbNav items={breadcrumbItems} />
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        <div id="report-content" className="space-y-8">
          <Card className="p-6">
            <h1 className="text-3xl font-bold mb-6">{rfp.title}</h1>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Project Details</h2>
                <div className="space-y-2">
                  <p><strong>Location:</strong> {rfp.jobLocation}</p>
                  <p><strong>Budget:</strong> ${rfp.budgetMin?.toLocaleString() || "Not specified"}</p>
                  <p><strong>Due Date:</strong> {format(new Date(rfp.deadline), "PPp")}</p>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Key Dates</h2>
                <div className="space-y-2">
                  <p><strong>Walkthrough:</strong> {format(new Date(rfp.walkthroughDate), "PPp")}</p>
                  <p><strong>RFI Due:</strong> {format(new Date(rfp.rfiDate), "PPp")}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Project Description</h2>
              <p className="whitespace-pre-wrap">{rfp.description}</p>
            </div>

            {rfp.certificationGoals && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Certification Goals</h2>
                <p>{rfp.certificationGoals}</p>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-4">Bidders Information</h2>
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
          </Card>
        </div>
      </main>
    </div>
  );
}
