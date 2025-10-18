import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Rfp, Rfi, User } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import { getCertificationClasses } from "@/lib/utils";

export default function DetailedReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: rfp, isLoading: loadingRfp } = useQuery<Rfp>({
    queryKey: [`/api/rfps/${id}`],
  });

  // Enhanced query to get RFIs with associated organization data
  const { data: rfis } = useQuery<(Rfi & { organization?: User })[]>({
    queryKey: [`/api/rfps/${id}/rfi`],
  });

  // Redirect if the RFP doesn't exist or doesn't belong to the user
  useEffect(() => {
    if (!loadingRfp && (!rfp || rfp.organizationId !== user?.id)) {
      navigate("/dashboard/reports");
    }
  }, [rfp, user, loadingRfp, navigate]);

  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
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

    // Save current theme state
    const root = window.document.documentElement;
    const wasDarkMode = root.classList.contains('dark');
    
    // Force light mode for PDF generation
    root.classList.remove('dark');
    root.classList.add('light');

    // Generate PDF and then restore original theme
    html2pdf().set(opt).from(element).save().then(() => {
      // Restore original theme
      if (wasDarkMode) {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    });
  };

  if (loadingRfp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (!rfp || rfp.organizationId !== user?.id) {
    return null; // The useEffect will handle the redirect
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
                  <p><strong>Location:</strong> {rfp.jobStreet}, {rfp.jobCity}, {rfp.jobState} {rfp.jobZip}</p>
                  <p><strong>Budget:</strong> ${rfp.budgetMin?.toLocaleString() || "Not specified"}</p>
                  <p><strong>Due Date:</strong> {format(new Date(rfp.deadline), "MM/dd/yyyy h:mm a")}</p>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Key Dates</h2>
                <div className="space-y-2">
                  <p><strong>Walkthrough:</strong> {format(new Date(rfp.walkthroughDate), "MM/dd/yyyy h:mm a")}</p>
                  <p><strong>RFI Due:</strong> {format(new Date(rfp.rfiDate), "MM/dd/yyyy h:mm a")}</p>
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
                    <TableHead>Certifications</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfis?.map((rfi) => (
                    <TableRow key={rfi.id}>
                      <TableCell>{rfi.organization?.companyName || 'N/A'}</TableCell>
                      <TableCell>{rfi.organization?.contact || rfi.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {rfi.organization?.certificationName && Array.isArray(rfi.organization.certificationName) && 
                           rfi.organization.certificationName.map((cert, index) => (
                            <Badge 
                              key={index} 
                              className={getCertificationClasses(cert)}
                            >
                              {cert}
                            </Badge>
                          ))}
                          {(!rfi.organization?.certificationName || !Array.isArray(rfi.organization.certificationName) || 
                            rfi.organization.certificationName.length === 0) && (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(rfi.createdAt), "MM/dd/yyyy")}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{rfi.message}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          rfi.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          rfi.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {rfi.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!rfis || rfis.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No bids received yet</TableCell>
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