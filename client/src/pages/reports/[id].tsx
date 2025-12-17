import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Rfp, Rfi, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { format } from "date-fns";
import { Download, Award } from "lucide-react";
import { Link } from "wouter";
import html2pdf from 'html2pdf.js';
import DOMPurify from 'dompurify';
import { ReportDetailSkeleton } from "@/components/skeletons";

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
      html2canvas: { scale: 2, useCORS: true },
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
      <div className="min-h-screen bg-background">
        <DashboardSidebar currentPath={location} />
        <div className="flex-1 md:ml-[280px]">
          <main className="w-full min-h-screen pb-16 md:pb-0 mt-14 md:mt-0">
            <ReportDetailSkeleton />
          </main>
        </div>
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
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Link href={`/reports/certification/${id}`}>
                  <Button variant="outline" className="w-full sm:w-auto" data-testid="link-certification-report">
                    <Award className="mr-2 h-4 w-4" />
                    Certification Report
                  </Button>
                </Link>
                <Button onClick={handleDownload} className="w-full sm:w-auto" data-testid="button-download-pdf">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>

            <div id="report-content" className="bg-white text-black" style={{ maxWidth: '8.5in', margin: '0 auto' }}>
              {/* Logo Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-200">
                <img
                  src="/fcb-logo.png"
                  alt="FindConstructionBids Logo"
                  className="h-12 object-contain"
                  data-testid="img-fcb-logo"
                />
                {user?.logo && (
                  <img
                    src={user.logo}
                    alt={`${user.companyName} Logo`}
                    className="h-12 object-contain"
                    crossOrigin="anonymous"
                    data-testid="img-client-logo"
                  />
                )}
              </div>

              {/* Report Content */}
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4 text-gray-900">{rfp.title}</h1>

                {/* Project Details Grid */}
                <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                  <div className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-800 border-b pb-1">Project Details</h2>
                    <p><span className="font-medium">Location:</span> {rfp.jobStreet}, {rfp.jobCity}, {rfp.jobState} {rfp.jobZip}</p>
                    <p><span className="font-medium">Budget:</span> ${rfp.budgetMin?.toLocaleString() || "Not specified"}</p>
                    <p><span className="font-medium">Due Date:</span> {format(new Date(rfp.deadline), "MM/dd/yyyy h:mm a")}</p>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-base font-semibold text-gray-800 border-b pb-1">Key Dates</h2>
                    <p><span className="font-medium">Walkthrough:</span> {format(new Date(rfp.walkthroughDate), "MM/dd/yyyy h:mm a")}</p>
                    <p><span className="font-medium">RFI Due:</span> {format(new Date(rfp.rfiDate), "MM/dd/yyyy h:mm a")}</p>
                  </div>
                </div>

                {/* Project Description */}
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-gray-800 border-b pb-1 mb-3">Project Description</h2>
                  <div 
                    className="text-sm leading-relaxed text-gray-700"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rfp.description) }}
                  />
                </div>

                {/* Certification Goals */}
                {rfp.certificationGoals && rfp.certificationGoals.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-base font-semibold text-gray-800 border-b pb-1 mb-3">Certification Goals</h2>
                    <div className="flex flex-wrap gap-2">
                      {rfp.certificationGoals.map((cert, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bidders Table */}
                <div>
                  <h2 className="text-base font-semibold text-gray-800 border-b pb-1 mb-3">Bidders Information</h2>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Company</th>
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Contact</th>
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Certifications</th>
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Date</th>
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfis?.map((rfi) => (
                        <tr key={rfi.id}>
                          <td className="border border-gray-300 px-2 py-2 align-top">
                            <div className="font-medium">
                              {rfi.organization?.companyName || rfi.email}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-2 py-2 align-top">
                            <div>
                              {(rfi.organization?.firstName || rfi.organization?.lastName) && (
                                <div className="font-medium">
                                  {[rfi.organization.firstName, rfi.organization.lastName].filter(Boolean).join(' ')}
                                </div>
                              )}
                              <div className="text-gray-600">{rfi.email}</div>
                              {rfi.organization?.telephone && (
                                <div className="text-gray-500">Tel: {rfi.organization.telephone}</div>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-2 py-2 align-top">
                            {rfi.organization?.certificationName && 
                             Array.isArray(rfi.organization.certificationName) && 
                             rfi.organization.certificationName.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {rfi.organization.certificationName.map((cert, index) => (
                                  <span key={index} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                    {cert}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 align-top whitespace-nowrap">
                            {format(new Date(rfi.createdAt), "MM/dd/yyyy")}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 align-top">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              rfi.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              rfi.status === 'responded' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {rfi.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!rfis || rfis.length === 0) && (
                        <tr>
                          <td colSpan={5} className="border border-gray-300 px-2 py-6 text-center text-gray-500">
                            No bids received yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
                  <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")} | FindConstructionBids.com</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}