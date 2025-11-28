import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Rfp, Rfi, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
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
import DOMPurify from 'dompurify';

export default function DetailedReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [location, navigate] = useLocation();

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
      <DashboardSidebar currentPath={location} />
      
      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <BreadcrumbNav items={breadcrumbItems} />
              <Button onClick={handleDownload} className="w-full sm:w-auto">
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
              <div 
                className="prose prose-sm max-w-none dark:prose-invert text-justify leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rfp.description) }}
              />
            </div>

            {rfp.certificationGoals && rfp.certificationGoals.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Certification Goals</h2>
                <div className="flex flex-wrap gap-2">
                  {rfp.certificationGoals.map((cert, index) => (
                    <Badge 
                      key={index} 
                      className={getCertificationClasses(cert)}
                    >
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-4">Bidders Information</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Company/Organization</TableHead>
                      <TableHead className="min-w-[150px]">Contact</TableHead>
                      <TableHead className="min-w-[200px]">Certifications</TableHead>
                      <TableHead className="min-w-[120px]">View Date</TableHead>
                      <TableHead className="min-w-[120px]">Due Date</TableHead>
                      <TableHead className="min-w-[200px]">Message</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfis?.map((rfi) => (
                      <TableRow key={rfi.id}>
                        <TableCell className="font-medium">
                          {rfi.organization?.companyName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {(rfi.organization?.firstName || rfi.organization?.lastName) && (
                              <div className="font-medium">
                                {[rfi.organization.firstName, rfi.organization.lastName]
                                  .filter(Boolean)
                                  .join(' ')}
                              </div>
                            )}
                            <div className="break-all">{rfi.email}</div>
                            {rfi.organization?.telephone && (
                              <div className="text-muted-foreground text-xs">
                                Tel: {rfi.organization.telephone}
                              </div>
                            )}
                            {rfi.organization?.cell && (
                              <div className="text-muted-foreground text-xs">
                                Cell: {rfi.organization.cell}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {rfi.organization?.certificationName && 
                             Array.isArray(rfi.organization.certificationName) && 
                             rfi.organization.certificationName.length > 0 ? (
                              rfi.organization.certificationName.map((cert, index) => (
                                <Badge 
                                  key={index} 
                                  className={getCertificationClasses(cert)}
                                >
                                  {cert}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(rfi.createdAt), "MM/dd/yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(rfp.deadline), "MM/dd/yyyy")}
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <div className="truncate" title={rfi.message}>
                            {rfi.message}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                            rfi.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                            rfi.status === 'responded' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                          }`}>
                            {rfi.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!rfis || rfis.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No bids received yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}