import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Rfp, Rfi, User, RfpViewSession } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { ReportDetailSkeleton } from "@/components/skeletons";
import { exportReportPdf } from "@/lib/report-pdf";
import { useToast } from "@/hooks/use-toast";
import "./report.css";

export default function UnifiedReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: rfp, isLoading: loadingRfp } = useQuery<Rfp>({
    queryKey: [`/api/rfps/${id}`],
  });

  const { data: rfis } = useQuery<(Rfi & { organization?: User })[]>({
    queryKey: [`/api/rfps/${id}/rfi`],
  });

  const { data: viewSessions } = useQuery<(RfpViewSession & { user?: User })[]>({
    queryKey: [`/api/analytics/rfp/${id}/views`],
  });

  useEffect(() => {
    if (!loadingRfp && (!rfp || rfp.organizationId !== user?.id)) {
      navigate("/dashboard/reports");
    }
  }, [rfp, user, loadingRfp, navigate]);

  const [logoError, setLogoError] = useState(false);

  const certificationGoals = useMemo(
    () => (rfp?.certificationGoals || []).filter(goal => goal && goal !== "None"),
    [rfp]
  );

  const bidderCertifications = useMemo(() => {
    if (!rfis || !Array.isArray(rfis)) return [];
    return rfis.map(rfi => ({
      ...rfi,
      certs: Array.isArray(rfi.organization?.certificationName) 
        ? rfi.organization.certificationName.filter(cert => Boolean(cert) && cert !== "None")
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

  const totalViews = useMemo(() => {
    return viewSessions?.length || 0;
  }, [viewSessions]);

  const uniqueViewers = useMemo(() => {
    if (!viewSessions) return 0;
    const uniqueUserIds = new Set(viewSessions.map(s => s.userId).filter(Boolean));
    return uniqueUserIds.size;
  }, [viewSessions]);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Reports", href: "/dashboard/reports" },
    { label: rfp?.title || "Report", href: `/reports/${id}` },
  ];

  const handleDownload = async () => {
    const element = document.getElementById("report-content");
    if (!element || isExporting) return;
    setIsExporting(true);
    try {
      await exportReportPdf(element, `${rfp?.title || "rfp"}-report.pdf`);
    } catch {
      toast({
        title: "PDF export failed",
        description: "The report could not be downloaded. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getBidderComplianceStatus = (certs: string[]) => {
    if (!certificationGoals.length || !bidderCertifications.length) return 'no-goals';
    const hasMatch = certificationGoals.some(goal => certs.includes(goal));
    return hasMatch ? 'compliant' : 'non-compliant';
  };

  if (loadingRfp) {
    return (
      <div className="report-page min-h-screen">
        <div className="report-shell"><DashboardSidebar currentPath={location} /></div>
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
    <div className="report-page min-h-screen">
      <div className="report-shell"><DashboardSidebar currentPath={location} /></div>
      
      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 mt-14 md:mt-0">
            <div className="report-toolbar flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <BreadcrumbNav items={breadcrumbItems} />
              <Button onClick={handleDownload} disabled={isExporting} className="report-download w-full sm:w-auto" data-testid="button-download-pdf">
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Preparing PDF…" : "Download PDF"}
              </Button>
            </div>

            <div className="report-print-area">
            <div id="report-content" className="report-sheet report-document">
              {/* Logo Header */}
              <div className="report-brand-header flex items-center justify-between px-6 py-4">
                <img
                  src="/fcb-logo.png"
                  alt="FindConstructionBids Logo"
                  className="h-12 object-contain"
                  data-testid="img-fcb-logo"
                />
                {user?.logo && !logoError ? (
                  <img
                    src={user.logo}
                    alt={`${user.companyName} Logo`}
                    className="h-12 object-contain"
                    data-testid="img-client-logo"
                    onError={() => setLogoError(true)}
                  />
                ) : user?.companyName ? (
                  <div 
                    className="h-12 px-4 bg-[var(--report-panel)] border border-[var(--report-border)] rounded-md flex items-center justify-center"
                    data-testid="img-client-logo-fallback"
                  >
                    <span className="text-lg font-bold text-[var(--report-foreground)]">
                      {user.companyName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Report Content */}
              <div className="p-6">
                {/* Header Section */}
                <div className="mb-6">
                  <h1 className="report-title" data-testid="text-report-title">RFP Report</h1>
                  <p className="report-subtitle">{rfp.title}</p>
                </div>

                {/* Project Details and Key Dates - Using certification report grid design */}
                <div className="report-summary report-summary-grid grid grid-cols-4 gap-4 mb-6 text-sm p-4">
                  <div>
                    <span className="report-label">Location</span>
                    <p className="font-medium">{rfp.jobCity}, {rfp.jobState}</p>
                  </div>
                  <div>
                    <span className="report-label">Deadline</span>
                    <p className="font-medium">{format(new Date(rfp.deadline), "MM/dd/yyyy")}</p>
                  </div>
                  <div>
                    <span className="report-label">Walkthrough</span>
                    <p className="font-medium">{rfp.walkthroughDate ? format(new Date(rfp.walkthroughDate), "MM/dd/yyyy") : "--"}</p>
                  </div>
                  <div>
                    <span className="report-label">RFI Due</span>
                    <p className="font-medium">{rfp.rfiDate ? format(new Date(rfp.rfiDate), "MM/dd/yyyy") : "--"}</p>
                  </div>
                </div>

                {/* Stats Cards - Including Total Reach */}
                <div className="report-stats-grid grid grid-cols-5 gap-4 mb-6">
                  <div className="report-stat-card" data-testid="card-total-bidders">
                    <p className="report-metric">{bidderCertifications.length}</p>
                    <p className="report-muted text-xs">Total Bidders</p>
                  </div>
                  <div className="report-stat-card" data-testid="card-total-reach">
                    <p className="report-metric">{totalViews}</p>
                    <p className="report-muted text-xs">Total Reach</p>
                  </div>
                  <div className="report-stat-card" data-testid="card-unique-viewers">
                    <p className="report-metric">{uniqueViewers}</p>
                    <p className="report-muted text-xs">Unique Viewers</p>
                  </div>
                  <div className="report-stat-card" data-testid="card-compliant-bidders">
                    <p className={`report-metric ${!certificationGoals.length || !bidderCertifications.length ? "report-muted" : "report-chart-green"}`}>{goalComplianceStats.matched}</p>
                    <p className="report-muted text-xs">Compliant</p>
                  </div>
                  <div className="report-stat-card" data-testid="card-compliance-rate">
                    <p className={`report-metric ${!certificationGoals.length || !goalComplianceStats.total ? "report-muted" : goalComplianceStats.matched === goalComplianceStats.total ? "report-chart-green" : "report-destructive"}`}>{certificationGoals.length && goalComplianceStats.total ? `${goalComplianceStats.percentage}%` : "—"}</p>
                    <p className="report-muted text-xs">Compliance Rate</p>
                  </div>
                </div>

                {/* Certification Goals Summary */}
                {certificationGoals.length > 0 && (
                  <div className="mb-6">
                    <h2 className="report-section-title">RFP Certification Goals</h2>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {certificationGoals.map((goal, index) => {
                        const count = certificationStats.find(s => s.name === goal)?.count || 0;
                        return (
                          <span key={index} className="report-chip report-chip-goal">
                            {goal} ({count})
                          </span>
                        );
                      })}
                    </div>
                    {goalComplianceStats.total > 0 && (
                      <div className="report-goal-summary text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Goal Achievement:</span>
                          <span className={`font-semibold ${goalComplianceStats.matched === goalComplianceStats.total ? "report-chart-green" : "report-destructive"}`}>{goalComplianceStats.matched} of {goalComplianceStats.total} bidders ({goalComplianceStats.percentage}%)</span>
                        </div>
                        <p className="report-muted mt-1">A bidder is counted when at least one certification goal is matched; 100% means every bidder matches at least one goal.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Certification Distribution */}
                {certificationStats.length > 0 && (
                  <div className="mb-6">
                    <h2 className="report-section-title">Certification Distribution</h2>
                    <div className="report-distribution-grid grid grid-cols-5 gap-2">
                      {certificationStats.slice(0, 10).map((stat, index) => (
                        <div 
                          key={stat.name} 
                          className="report-stat-tile"
                          data-testid={`card-cert-stat-${index}`}
                        >
                          <span className="report-chip block mb-1">
                            {stat.name}
                          </span>
                          <p className="font-semibold">{stat.count}</p>
                          <p className="report-muted text-xs">bidder{stat.count !== 1 ? 's' : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Reach / View Sessions Table */}
                <div className="report-table-section mb-6">
                  <h2 className="report-section-title">Total Reach</h2>
                  <div className="report-table-wrap"><table className="report-table">
                    <thead>
                      <tr>
                        <th>Viewer</th><th>Company</th><th>View Date</th><th>Certifications</th><th>Converted to Bid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewSessions && viewSessions.length > 0 ? (
                        viewSessions.map((session, index) => (
                          <tr key={session.id || index} data-testid={`row-view-session-${session.id}`}>
                            <td>
                              {session.user ? (
                                <div>
                                  {(session.user.firstName || session.user.lastName) && (
                                    <div className="font-medium">
                                      {[session.user.firstName, session.user.lastName].filter(Boolean).join(' ')}
                                    </div>
                                  )}
                                  <div className="report-muted">{session.user.email}</div>
                                </div>
                              ) : (
                                <span className="report-muted">Anonymous</span>
                              )}
                            </td>
                            <td>
                              {session.user?.companyName || <span className="report-muted">-</span>}
                            </td>
                            <td className="whitespace-nowrap">
                              {session.viewDate ? format(new Date(session.viewDate), "MM/dd/yyyy h:mm a") : '-'}
                            </td>
                            <td>
                              {session.user?.certificationName && session.user.certificationName.length > 0 && session.user.certificationName.some((c: string) => c !== "None") ? (
                                <div className="flex flex-wrap gap-1">
                                  {session.user.certificationName.filter((c: string) => c !== "None").map((cert: string, idx: number) => (
                                    <span key={idx} className="report-chip">
                                      {cert}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="report-muted">None</span>
                              )}
                            </td>
                            <td>
                              {session.convertedToBid ? (
                                <span className="report-chip report-status-compliant">Yes</span>
                              ) : (
                                <span className="report-chip">No</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="report-muted text-center">
                            No views recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table></div>
                </div>

                {/* Bidders Information Table */}
                <div className="report-table-section mb-6">
                  <h2 className="report-section-title">Bidder Certification Details</h2>
                  <div className="report-table-wrap"><table className="report-table">
                    <thead>
                      <tr>
                        <th>Company</th><th>Contact</th><th>Certifications</th><th>Status</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bidderCertifications.map((bidder) => {
                        const status = getBidderComplianceStatus(bidder.certs);
                        return (
                          <tr key={bidder.id} data-testid={`row-bidder-${bidder.id}`}>
                            <td>
                              <div className="font-medium">
                                {bidder.organization?.companyName || bidder.email}
                              </div>
                            </td>
                            <td>
                              <div>
                                {(bidder.organization?.firstName || bidder.organization?.lastName) && (
                                  <div className="font-medium">
                                    {[bidder.organization.firstName, bidder.organization.lastName].filter(Boolean).join(' ')}
                                  </div>
                                )}
                                <div className="report-muted">{bidder.email}</div>
                              </div>
                            </td>
                            <td>
                              {bidder.certs.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {bidder.certs.map((cert, index) => {
                                    const isGoal = certificationGoals.includes(cert);
                                    return (
                                      <span 
                                        key={index} 
                                        className={`report-chip ${isGoal ? "report-chip-goal" : ""}`}
                                      >
                                        {cert}{isGoal ? " · Goal" : ""}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="report-muted">None</span>
                              )}
                            </td>
                            <td>
                              {status === 'compliant' ? (
                                <span className="report-chip report-status-compliant">
                                  Compliant
                                </span>
                              ) : status === 'non-compliant' ? (
                                <span className="report-chip report-status-noncompliant">
                                  Non-compliant
                                </span>
                              ) : (
                                <span className="report-muted">N/A</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap">
                              {format(new Date(bidder.createdAt), "MM/dd/yyyy")}
                            </td>
                          </tr>
                        );
                      })}
                      {bidderCertifications.length === 0 && (
                        <tr>
                          <td colSpan={5} className="report-muted text-center">
                            No bidders have submitted RFIs yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table></div>
                </div>

                {/* Footer */}
                <div className="report-footer mt-8 pt-4 text-xs text-center">
                  <p>Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")} | FindConstructionBids.com</p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
