import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Rfp, Rfi, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { format } from "date-fns";
import { Download } from "lucide-react";
import html2pdf from 'html2pdf.js';
import { ReportDetailSkeleton } from "@/components/skeletons";

export default function CertificationReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  const { data: rfp, isLoading: loadingRfp } = useQuery<Rfp>({
    queryKey: [`/api/rfps/${id}`],
  });

  const { data: rfis } = useQuery<(Rfi & { organization?: User })[]>({
    queryKey: [`/api/rfps/${id}/rfi`],
  });

  useEffect(() => {
    if (!loadingRfp && (!rfp || rfp.organizationId !== user?.id)) {
      navigate("/dashboard/reports");
    }
  }, [rfp, user, loadingRfp, navigate]);

  const certificationGoals = useMemo(() => rfp?.certificationGoals || [], [rfp]);

  const bidderCertifications = useMemo(() => {
    if (!rfis || !Array.isArray(rfis)) return [];
    return rfis.map(rfi => ({
      ...rfi,
      certs: Array.isArray(rfi.organization?.certificationName) 
        ? rfi.organization.certificationName.filter(Boolean) 
        : [],
    }));
  }, [rfis]);

  const certificationStats = useMemo(() => {
    if (!bidderCertifications.length) return [];
    const stats: Record<string, number> = {};
    
    bidderCertifications.forEach(bidder => {
      if (!Array.isArray(bidder.certs)) return;
      bidder.certs.forEach(cert => {
        if (cert && typeof cert === 'string' && cert !== "None") {
          stats[cert] = (stats[cert] || 0) + 1;
        }
      });
    });

    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [bidderCertifications]);

  const goalComplianceStats = useMemo(() => {
    if (!certificationGoals.length) return { matched: 0, total: 0, percentage: 0 };

    const biddersWithMatchingCerts = bidderCertifications.filter(bidder => {
      return certificationGoals.some(goal => 
        bidder.certs.includes(goal)
      );
    });

    const totalBidders = bidderCertifications.length;
    const matchedBidders = biddersWithMatchingCerts.length;
    const percentage = totalBidders > 0 ? Math.round((matchedBidders / totalBidders) * 100) : 0;

    return { matched: matchedBidders, total: totalBidders, percentage };
  }, [certificationGoals, bidderCertifications]);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Reports", href: "/dashboard/reports" },
    { label: rfp?.title || "Certification Report", href: `/reports/${id}` },
    { label: "Certification Analysis", href: `/reports/certification/${id}` },
  ];

  const handleDownload = () => {
    const element = document.getElementById('certification-report-content');
    const opt = {
      margin: 0.5,
      filename: `${rfp?.title}-certification-report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const root = window.document.documentElement;
    const wasDarkMode = root.classList.contains('dark');
    
    root.classList.remove('dark');
    root.classList.add('light');

    html2pdf().set(opt).from(element).save().then(() => {
      if (wasDarkMode) {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    });
  };

  const getBidderComplianceStatus = (certs: string[]) => {
    if (!certificationGoals.length) return 'no-goals';
    const hasMatch = certificationGoals.some(goal => certs.includes(goal));
    return hasMatch ? 'compliant' : 'non-compliant';
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
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />
      
      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <BreadcrumbNav items={breadcrumbItems} />
              <Button onClick={handleDownload} className="w-full sm:w-auto" data-testid="button-download-pdf">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>

            <div id="certification-report-content" className="bg-white text-black" style={{ maxWidth: '8.5in', margin: '0 auto' }}>
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
                {/* Header Section */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900" data-testid="text-report-title">Certification Compliance Report</h1>
                  <p className="text-gray-600">{rfp.title}</p>
                </div>

                {/* Summary Info */}
                <div className="grid grid-cols-4 gap-4 mb-6 text-sm border rounded-lg p-4 bg-gray-50">
                  <div>
                    <span className="text-gray-500 text-xs">Location</span>
                    <p className="font-medium text-gray-900">{rfp.jobCity}, {rfp.jobState}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Deadline</span>
                    <p className="font-medium text-gray-900">{format(new Date(rfp.deadline), "MM/dd/yyyy")}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Report Generated</span>
                    <p className="font-medium text-gray-900">{format(new Date(), "MM/dd/yyyy")}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Total Bidders</span>
                    <p className="font-medium text-gray-900">{bidderCertifications.length}</p>
                  </div>
                </div>

                {/* Stats Cards - Simplified for PDF */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="border rounded-lg p-3 text-center" data-testid="card-total-bidders">
                    <p className="text-2xl font-bold text-gray-900">{bidderCertifications.length}</p>
                    <p className="text-xs text-gray-500">Total Bidders</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center" data-testid="card-certification-goals">
                    <p className="text-2xl font-bold text-gray-900">{certificationGoals.filter(g => g !== "None").length}</p>
                    <p className="text-xs text-gray-500">Cert. Goals</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center" data-testid="card-compliant-bidders">
                    <p className="text-2xl font-bold text-green-600">{goalComplianceStats.matched}</p>
                    <p className="text-xs text-gray-500">Compliant</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center" data-testid="card-compliance-rate">
                    <p className="text-2xl font-bold text-gray-900">{goalComplianceStats.percentage}%</p>
                    <p className="text-xs text-gray-500">Compliance Rate</p>
                  </div>
                </div>

                {/* Certification Goals */}
                {certificationGoals.length > 0 && certificationGoals.some(g => g !== "None") && (
                  <div className="mb-6">
                    <h2 className="text-base font-semibold text-gray-800 border-b pb-1 mb-3">RFP Certification Goals</h2>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {certificationGoals.filter(g => g !== "None").map((goal, index) => {
                        const count = certificationStats.find(s => s.name === goal)?.count || 0;
                        return (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                            {goal} ({count})
                          </span>
                        );
                      })}
                    </div>
                    {goalComplianceStats.total > 0 && (
                      <div className="bg-gray-100 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">Goal Achievement:</span>
                          <span className="font-bold text-gray-900">{goalComplianceStats.matched} of {goalComplianceStats.total} bidders ({goalComplianceStats.percentage}%)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Certification Distribution - Simple table instead of charts for PDF */}
                {certificationStats.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-base font-semibold text-gray-800 border-b pb-1 mb-3">Certification Distribution</h2>
                    <div className="grid grid-cols-5 gap-2">
                      {certificationStats.map((stat, index) => (
                        <div 
                          key={stat.name} 
                          className="border rounded p-2 text-center bg-gray-50"
                          data-testid={`card-cert-stat-${index}`}
                        >
                          <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium block mb-1">
                            {stat.name}
                          </span>
                          <p className="text-lg font-bold text-gray-900">{stat.count}</p>
                          <p className="text-xs text-gray-500">bidder{stat.count !== 1 ? 's' : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bidder Details Table */}
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-gray-800 border-b pb-1 mb-3">Bidder Certification Details</h2>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Company</th>
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Contact</th>
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Certifications</th>
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Status</th>
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bidderCertifications.map((bidder) => {
                        const status = getBidderComplianceStatus(bidder.certs);
                        return (
                          <tr key={bidder.id} data-testid={`row-bidder-${bidder.id}`}>
                            <td className="border border-gray-300 px-2 py-2 align-top">
                              <div className="font-medium">
                                {bidder.organization?.companyName || bidder.email}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-2 py-2 align-top">
                              <div>
                                {(bidder.organization?.firstName || bidder.organization?.lastName) && (
                                  <div className="font-medium">
                                    {[bidder.organization.firstName, bidder.organization.lastName].filter(Boolean).join(' ')}
                                  </div>
                                )}
                                <div className="text-gray-600">{bidder.email}</div>
                              </div>
                            </td>
                            <td className="border border-gray-300 px-2 py-2 align-top">
                              {bidder.certs.length > 0 && bidder.certs.some(c => c !== "None") ? (
                                <div className="flex flex-wrap gap-1">
                                  {bidder.certs.filter(c => c !== "None").map((cert, index) => {
                                    const isGoal = certificationGoals.includes(cert);
                                    return (
                                      <span 
                                        key={index} 
                                        className={`px-1 py-0.5 rounded text-xs ${isGoal ? 'bg-green-100 text-green-800 font-medium' : 'bg-blue-100 text-blue-800'}`}
                                      >
                                        {cert}{isGoal ? ' ✓' : ''}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 align-top">
                              {status === 'compliant' ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  Compliant
                                </span>
                              ) : status === 'non-compliant' ? (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                                  Non-compliant
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">N/A</span>
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 align-top whitespace-nowrap">
                              {format(new Date(bidder.createdAt), "MM/dd/yyyy")}
                            </td>
                          </tr>
                        );
                      })}
                      {bidderCertifications.length === 0 && (
                        <tr>
                          <td colSpan={5} className="border border-gray-300 px-2 py-6 text-center text-gray-500">
                            No bidders have submitted RFIs yet
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
