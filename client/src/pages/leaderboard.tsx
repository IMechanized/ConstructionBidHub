import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  TrendingUp, 
  Share2,
  Calendar,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  Home
} from "lucide-react";
import { LandingPageHeader } from "@/components/landing-page-header";
import { Footer } from "@/components/ui/footer";
import type { Rfp } from "@shared/schema";

interface RfpReach {
  id: number;
  rfpId: number;
  womenOwned: number | null;
  nativeAmericanOwned: number | null;
  veteranOwned: number | null;
  militarySpouse: number | null;
  lgbtqOwned: number | null;
  rural: number | null;
  minorityOwned: number | null;
  section3: number | null;
  sbe: number | null;
  dbe: number | null;
  totalReach: number | null;
  createdAt: string;
  updatedAt: string;
  rfp: Rfp;
}

interface LeaderboardEntry {
  clientName: string;
  totalReach: number;
  rfpCount: number;
}

const CERTIFICATION_LABELS: Record<string, string> = {
  womenOwned: "Women-owned",
  nativeAmericanOwned: "Native American-owned",
  veteranOwned: "Veteran-owned",
  militarySpouse: "Military Spouse",
  lgbtqOwned: "LGBTQ-owned",
  rural: "Rural",
  minorityOwned: "Minority-owned",
  section3: "Section 3",
  sbe: "SBE",
  dbe: "DBE",
};

const CLIENTS_PER_PAGE = 10;

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'quarterly' | '6-month' | 'all-time'>('quarterly');
  const [clientPage, setClientPage] = useState(0);

  const { data: reachReport, isLoading: reportLoading } = useQuery<RfpReach[]>({
    queryKey: ['/api/reports/reach', period],
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/reports/leaderboard'],
  });

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'FindConstructionBids Reach Report',
        text: `Check out the ${period === 'quarterly' ? 'Quarterly' : period === '6-month' ? '6-Month' : 'All-Time'} Reach Report`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const totals = reachReport?.reduce((acc, item) => {
    acc.womenOwned += item.womenOwned || 0;
    acc.nativeAmericanOwned += item.nativeAmericanOwned || 0;
    acc.veteranOwned += item.veteranOwned || 0;
    acc.militarySpouse += item.militarySpouse || 0;
    acc.lgbtqOwned += item.lgbtqOwned || 0;
    acc.rural += item.rural || 0;
    acc.minorityOwned += item.minorityOwned || 0;
    acc.section3 += item.section3 || 0;
    acc.sbe += item.sbe || 0;
    acc.dbe += item.dbe || 0;
    acc.totalReach += item.totalReach || 0;
    return acc;
  }, {
    womenOwned: 0,
    nativeAmericanOwned: 0,
    veteranOwned: 0,
    militarySpouse: 0,
    lgbtqOwned: 0,
    rural: 0,
    minorityOwned: 0,
    section3: 0,
    sbe: 0,
    dbe: 0,
    totalReach: 0,
  }) || {
    womenOwned: 0,
    nativeAmericanOwned: 0,
    veteranOwned: 0,
    militarySpouse: 0,
    lgbtqOwned: 0,
    rural: 0,
    minorityOwned: 0,
    section3: 0,
    sbe: 0,
    dbe: 0,
    totalReach: 0,
  };

  // Pagination for client leaderboard
  const totalClients = leaderboard?.length || 0;
  const totalPages = Math.ceil(totalClients / CLIENTS_PER_PAGE);
  const paginatedClients = leaderboard?.slice(
    clientPage * CLIENTS_PER_PAGE,
    (clientPage + 1) * CLIENTS_PER_PAGE
  ) || [];

  return (
    <>
      <Helmet>
        <title>Reach Leaderboard | FindConstructionBids</title>
        <meta name="description" content="View the reach report and leaderboard for construction RFPs by certification type." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <LandingPageHeader />

        <main className="container mx-auto px-4 py-6 flex-1">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" data-testid="breadcrumb">
            <Link href="/" className="hover:text-foreground flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Reach Leaderboard</span>
          </nav>

          {/* Page Title and Share Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
                <Trophy className="h-7 w-7 text-yellow-500" />
                Reach Leaderboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Tracking contractor outreach across all RFPs
              </p>
            </div>
            <Button onClick={handleShare} variant="outline" data-testid="button-share">
              <Share2 className="h-4 w-4 mr-2" />
              Share Report
            </Button>
          </div>

          <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)} className="space-y-6">
            <TabsList data-testid="tabs-period">
              <TabsTrigger value="quarterly" data-testid="tab-quarterly">
                <Calendar className="h-4 w-4 mr-2" />
                This Quarter
              </TabsTrigger>
              <TabsTrigger value="6-month" data-testid="tab-6month">
                <Calendar className="h-4 w-4 mr-2" />
                6 Months
              </TabsTrigger>
              <TabsTrigger value="all-time" data-testid="tab-alltime">
                <TrendingUp className="h-4 w-4 mr-2" />
                All Time
              </TabsTrigger>
            </TabsList>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Card data-testid="card-total-reach">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold" data-testid="text-total-reach">{totals.totalReach.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card data-testid="card-rfp-count">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">RFPs Posted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold" data-testid="text-rfp-count">{reachReport?.length || 0}</div>
                </CardContent>
              </Card>
              <Card data-testid="card-minority-reach">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Minority-owned Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold" data-testid="text-minority-reach">{totals.minorityOwned.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card data-testid="card-women-reach">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Women-owned Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold" data-testid="text-women-reach">{totals.womenOwned.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Certification Breakdown - Now first */}
            <Card data-testid="card-certification-breakdown">
              <CardHeader>
                <CardTitle>Certification Breakdown</CardTitle>
                <CardDescription>
                  Total reach by certification type for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {Object.entries(CERTIFICATION_LABELS).map(([key, label]) => (
                    <div key={key} className="p-4 rounded-lg bg-muted/50 text-center" data-testid={`cert-${key}`}>
                      <p className="text-xl sm:text-2xl font-bold">{(totals[key as keyof typeof totals] || 0).toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Client Leaderboard - Now second with pagination */}
            <Card data-testid="card-client-leaderboard">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Client Leaderboard
                    </CardTitle>
                    <CardDescription>
                      Top clients by total contractor reach
                    </CardDescription>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClientPage(p => Math.max(0, p - 1))}
                        disabled={clientPage === 0}
                        data-testid="button-prev-clients"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {clientPage + 1} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClientPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={clientPage >= totalPages - 1}
                        data-testid="button-next-clients"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : paginatedClients.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {paginatedClients.map((entry, index) => {
                      const globalIndex = clientPage * CLIENTS_PER_PAGE + index;
                      return (
                        <div
                          key={entry.clientName}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                          data-testid={`leaderboard-entry-${globalIndex}`}
                        >
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={globalIndex === 0 ? "default" : globalIndex < 3 ? "secondary" : "outline"}
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                            >
                              {globalIndex + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{entry.clientName}</p>
                              <p className="text-xs text-muted-foreground">{entry.rfpCount} RFPs</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{entry.totalReach.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">reach</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No leaderboard data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RFP Reach Details - Now third, full width with responsive table */}
            <Card data-testid="card-rfp-table">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  RFP Reach Details
                </CardTitle>
                <CardDescription>
                  Breakdown of contractor outreach by RFP and certification type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : reachReport && reachReport.length > 0 ? (
                  <div className="space-y-4">
                    {reachReport.map((item) => (
                      <div key={item.id} className="p-4 rounded-lg border bg-card" data-testid={`rfp-card-${item.rfpId}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <Link href={`/rfp/${item.rfp.jobState}/${item.rfp.slug}`}>
                              <span className="font-medium text-primary hover:underline cursor-pointer block truncate">
                                {item.rfp.title}
                              </span>
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {item.rfp.clientName || '-'} • Posted {item.rfp.createdAt ? format(new Date(item.rfp.createdAt), 'MM/dd/yyyy') : '-'}
                            </p>
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-lg px-3 py-1">
                            {item.totalReach || 0} total
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <p className="font-semibold">{item.minorityOwned || 0}</p>
                            <p className="text-xs text-muted-foreground">MBE</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <p className="font-semibold">{item.womenOwned || 0}</p>
                            <p className="text-xs text-muted-foreground">WBE</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <p className="font-semibold">{item.section3 || 0}</p>
                            <p className="text-xs text-muted-foreground">Sec 3</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <p className="font-semibold">{item.sbe || 0}</p>
                            <p className="text-xs text-muted-foreground">SBE</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <p className="font-semibold">{item.dbe || 0}</p>
                            <p className="text-xs text-muted-foreground">DBE</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <p className="font-semibold">{item.veteranOwned || 0}</p>
                            <p className="text-xs text-muted-foreground">Veteran</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <p className="font-semibold">{item.nativeAmericanOwned || 0}</p>
                            <p className="text-xs text-muted-foreground">Native Am.</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <p className="font-semibold">{item.lgbtqOwned || 0}</p>
                            <p className="text-xs text-muted-foreground">LGBTQ</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <p className="font-semibold">{item.militarySpouse || 0}</p>
                            <p className="text-xs text-muted-foreground">Mil. Spouse</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50 text-center">
                            <p className="font-semibold">{item.rural || 0}</p>
                            <p className="text-xs text-muted-foreground">Rural</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Totals Row */}
                    <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5" data-testid="row-totals">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                        <div>
                          <p className="font-bold text-lg">Totals</p>
                          <p className="text-sm text-muted-foreground">{reachReport.length} RFPs</p>
                        </div>
                        <Badge className="shrink-0 text-lg px-3 py-1">
                          {totals.totalReach} total reach
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                        <div className="p-2 rounded bg-background text-center">
                          <p className="font-bold">{totals.minorityOwned}</p>
                          <p className="text-xs text-muted-foreground">MBE</p>
                        </div>
                        <div className="p-2 rounded bg-background text-center">
                          <p className="font-bold">{totals.womenOwned}</p>
                          <p className="text-xs text-muted-foreground">WBE</p>
                        </div>
                        <div className="p-2 rounded bg-background text-center">
                          <p className="font-bold">{totals.section3}</p>
                          <p className="text-xs text-muted-foreground">Sec 3</p>
                        </div>
                        <div className="p-2 rounded bg-background text-center">
                          <p className="font-bold">{totals.sbe}</p>
                          <p className="text-xs text-muted-foreground">SBE</p>
                        </div>
                        <div className="p-2 rounded bg-background text-center">
                          <p className="font-bold">{totals.dbe}</p>
                          <p className="text-xs text-muted-foreground">DBE</p>
                        </div>
                        <div className="p-2 rounded bg-background text-center">
                          <p className="font-bold">{totals.veteranOwned}</p>
                          <p className="text-xs text-muted-foreground">Veteran</p>
                        </div>
                        <div className="p-2 rounded bg-background text-center">
                          <p className="font-bold">{totals.nativeAmericanOwned}</p>
                          <p className="text-xs text-muted-foreground">Native Am.</p>
                        </div>
                        <div className="p-2 rounded bg-background text-center">
                          <p className="font-bold">{totals.lgbtqOwned}</p>
                          <p className="text-xs text-muted-foreground">LGBTQ</p>
                        </div>
                        <div className="p-2 rounded bg-background text-center">
                          <p className="font-bold">{totals.militarySpouse}</p>
                          <p className="text-xs text-muted-foreground">Mil. Spouse</p>
                        </div>
                        <div className="p-2 rounded bg-background text-center">
                          <p className="font-bold">{totals.rural}</p>
                          <p className="text-xs text-muted-foreground">Rural</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No reach data available for this period
                  </div>
                )}
              </CardContent>
            </Card>
          </Tabs>
        </main>

        <Footer />
      </div>
    </>
  );
}
