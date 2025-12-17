import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Rfp, Rfi, User, CERTIFICATIONS } from "@shared/schema";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Award, Users, Target, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import html2pdf from 'html2pdf.js';
import { Badge } from "@/components/ui/badge";
import { getCertificationClasses } from "@/lib/utils";
import { ReportDetailSkeleton } from "@/components/skeletons";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTheme } from "@/components/theme-provider";
import { Progress } from "@/components/ui/progress";

const CHART_COLORS = [
  '#ec4899', '#f97316', '#3b82f6', '#6366f1', '#a855f7', 
  '#22c55e', '#f59e0b', '#14b8a6', '#ef4444', '#8b5cf6'
];

export default function CertificationReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { theme } = useTheme();

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

  const goalsVsActualData = useMemo(() => {
    if (!certificationGoals.length) return [];
    return certificationGoals
      .filter(goal => goal && typeof goal === 'string' && goal !== "None")
      .map(goal => {
        const actualCount = certificationStats.find(s => s.name === goal)?.count || 0;
        return {
          name: goal.length > 15 ? goal.substring(0, 12) + '...' : goal,
          fullName: goal,
          required: 1,
          actual: actualCount,
        };
      });
  }, [certificationGoals, certificationStats]);

  const pieChartData = useMemo(() => {
    return certificationStats.map((stat, index) => ({
      ...stat,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [certificationStats]);

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

            <div id="certification-report-content" className="space-y-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <img
                  src="/fcb-logo.png"
                  alt="FindConstructionBids Logo"
                  className="h-16 object-contain"
                  data-testid="img-fcb-logo"
                />
                {user?.logo && (
                  <img
                    src={user.logo}
                    alt={`${user.companyName} Logo`}
                    className="h-16 object-contain"
                    crossOrigin="anonymous"
                    data-testid="img-client-logo"
                  />
                )}
              </div>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold" data-testid="text-report-title">Certification Compliance Report</h1>
                    <p className="text-muted-foreground">{rfp.title}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{rfp.jobCity}, {rfp.jobState}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deadline:</span>
                    <p className="font-medium">{format(new Date(rfp.deadline), "MM/dd/yyyy")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Report Generated:</span>
                    <p className="font-medium">{format(new Date(), "MM/dd/yyyy")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Bidders:</span>
                    <p className="font-medium">{bidderCertifications.length}</p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card data-testid="card-total-bidders">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bidders</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bidderCertifications.length}</div>
                    <p className="text-xs text-muted-foreground">Submitted RFIs</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-certification-goals">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Certification Goals</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{certificationGoals.filter(g => g !== "None").length}</div>
                    <p className="text-xs text-muted-foreground">Required certifications</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-compliant-bidders">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compliant Bidders</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{goalComplianceStats.matched}</div>
                    <p className="text-xs text-muted-foreground">Meet certification goals</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-compliance-rate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{goalComplianceStats.percentage}%</div>
                    <Progress value={goalComplianceStats.percentage} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              {certificationGoals.length > 0 && certificationGoals.some(g => g !== "None") && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    RFP Certification Goals
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {certificationGoals.filter(g => g !== "None").map((goal, index) => {
                      const count = certificationStats.find(s => s.name === goal)?.count || 0;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <Badge className={getCertificationClasses(goal)}>
                            {goal}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({count} bidder{count !== 1 ? 's' : ''})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {goalComplianceStats.total > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Goal Achievement</span>
                        <span className="text-sm font-bold">{goalComplianceStats.matched} of {goalComplianceStats.total} bidders</span>
                      </div>
                      <Progress value={goalComplianceStats.percentage} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {goalComplianceStats.percentage >= 50 
                          ? "Good progress toward certification diversity goals"
                          : "Consider outreach to certified businesses to improve diversity"}
                      </p>
                    </div>
                  )}
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Certification Distribution</h2>
                  {pieChartData.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, count }) => `${name}: ${count}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No certification data available</p>
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Goals vs Actual</h2>
                  {goalsVsActualData.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={goalsVsActualData} layout="vertical" margin={{ left: 20, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value, name) => [value, name === 'actual' ? 'Bidders' : 'Goal']}
                            labelFormatter={(label) => goalsVsActualData.find(d => d.name === label)?.fullName || label}
                          />
                          <Legend />
                          <Bar dataKey="actual" fill="#22c55e" name="Actual Bidders" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No certification goals set for this RFP</p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Bidder Certification Details
                </h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Company</TableHead>
                        <TableHead className="min-w-[150px]">Contact</TableHead>
                        <TableHead className="min-w-[250px]">Certifications</TableHead>
                        <TableHead className="min-w-[120px]">Compliance</TableHead>
                        <TableHead className="min-w-[100px]">RFI Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bidderCertifications.map((bidder) => {
                        const status = getBidderComplianceStatus(bidder.certs);
                        return (
                          <TableRow key={bidder.id} data-testid={`row-bidder-${bidder.id}`}>
                            <TableCell className="font-medium">
                              {bidder.organization?.companyName || (
                                <span className="text-muted-foreground italic text-sm">
                                  {bidder.email}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                {(bidder.organization?.firstName || bidder.organization?.lastName) && (
                                  <div className="font-medium">
                                    {[bidder.organization.firstName, bidder.organization.lastName]
                                      .filter(Boolean)
                                      .join(' ')}
                                  </div>
                                )}
                                <div className="text-muted-foreground text-xs break-all">{bidder.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {bidder.certs.length > 0 && bidder.certs.some(c => c !== "None") ? (
                                  bidder.certs.filter(c => c !== "None").map((cert, index) => {
                                    const isGoal = certificationGoals.includes(cert);
                                    return (
                                      <Badge 
                                        key={index} 
                                        className={`${getCertificationClasses(cert)} ${isGoal ? 'ring-2 ring-green-500 ring-offset-1' : ''}`}
                                      >
                                        {cert}
                                        {isGoal && <CheckCircle className="h-3 w-3 ml-1" />}
                                      </Badge>
                                    );
                                  })
                                ) : (
                                  <span className="text-xs text-muted-foreground">None</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {status === 'compliant' ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Compliant
                                </Badge>
                              ) : status === 'non-compliant' ? (
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Non-compliant
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(bidder.createdAt), "MM/dd/yyyy")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {bidderCertifications.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No bidders have submitted RFIs yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {certificationStats.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Certification Summary</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {certificationStats.map((stat, index) => (
                      <div 
                        key={stat.name} 
                        className="bg-muted/50 rounded-lg p-3 text-center"
                        data-testid={`card-cert-stat-${index}`}
                      >
                        <Badge className={`${getCertificationClasses(stat.name)} mb-2`}>
                          {stat.name}
                        </Badge>
                        <p className="text-2xl font-bold">{stat.count}</p>
                        <p className="text-xs text-muted-foreground">bidder{stat.count !== 1 ? 's' : ''}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
