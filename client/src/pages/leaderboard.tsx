import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { format } from "date-fns";
import { generateClientSlug } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Home,
  ChevronDown
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
const RFPS_PER_PAGE = 15;

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'quarterly' | '6-month' | 'all-time'>('quarterly');
  const [clientPage, setClientPage] = useState(0);
  const [visibleRfps, setVisibleRfps] = useState(RFPS_PER_PAGE);

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

  const totalClients = leaderboard?.length || 0;
  const totalPages = Math.ceil(totalClients / CLIENTS_PER_PAGE);
  const paginatedClients = leaderboard?.slice(
    clientPage * CLIENTS_PER_PAGE,
    (clientPage + 1) * CLIENTS_PER_PAGE
  ) || [];

  const displayedRfps = reachReport?.slice(0, visibleRfps) || [];
  const hasMoreRfps = reachReport && reachReport.length > visibleRfps;

  return (
    <>
      <Helmet>
        <title>Reach Leaderboard | FindConstructionBids</title>
        <meta name="description" content="View the reach report and leaderboard for construction RFPs by certification type." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <LandingPageHeader />

        <main className="container mx-auto px-4 py-6 flex-1">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" data-testid="breadcrumb">
            <Link href="/" className="hover:text-foreground flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">Reach Leaderboard</span>
          </nav>

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

          <Tabs value={period} onValueChange={(v) => { setPeriod(v as typeof period); setVisibleRfps(RFPS_PER_PAGE); }} className="space-y-6">
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
              <CardContent className="space-y-4">
                {/* Totals Card - Always Visible */}
                <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5" data-testid="row-totals">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                    <div>
                      <p className="font-bold text-lg">Totals</p>
                      <p className="text-sm text-muted-foreground">{reachReport?.length || 0} RFPs</p>
                    </div>
                    <Badge className="shrink-0 text-lg px-3 py-1">
                      {totals.totalReach} total reach
                    </Badge>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 text-sm">
                    <div className="p-2 rounded bg-background text-center">
                      <p className="font-bold text-sm sm:text-base">{totals.minorityOwned}</p>
                      <p className="text-xs text-muted-foreground">MBE</p>
                    </div>
                    <div className="p-2 rounded bg-background text-center">
                      <p className="font-bold text-sm sm:text-base">{totals.womenOwned}</p>
                      <p className="text-xs text-muted-foreground">WBE</p>
                    </div>
                    <div className="p-2 rounded bg-background text-center">
                      <p className="font-bold text-sm sm:text-base">{totals.section3}</p>
                      <p className="text-xs text-muted-foreground">Sec3</p>
                    </div>
                    <div className="p-2 rounded bg-background text-center">
                      <p className="font-bold text-sm sm:text-base">{totals.sbe}</p>
                      <p className="text-xs text-muted-foreground">SBE</p>
                    </div>
                    <div className="p-2 rounded bg-background text-center">
                      <p className="font-bold text-sm sm:text-base">{totals.dbe}</p>
                      <p className="text-xs text-muted-foreground">DBE</p>
                    </div>
                    <div className="p-2 rounded bg-background text-center">
                      <p className="font-bold text-sm sm:text-base">{totals.veteranOwned}</p>
                      <p className="text-xs text-muted-foreground">Vet</p>
                    </div>
                    <div className="p-2 rounded bg-background text-center">
                      <p className="font-bold text-sm sm:text-base">{totals.nativeAmericanOwned}</p>
                      <p className="text-xs text-muted-foreground">NA</p>
                    </div>
                    <div className="p-2 rounded bg-background text-center">
                      <p className="font-bold text-sm sm:text-base">{totals.lgbtqOwned}</p>
                      <p className="text-xs text-muted-foreground">LGBTQ</p>
                    </div>
                    <div className="p-2 rounded bg-background text-center">
                      <p className="font-bold text-sm sm:text-base">{totals.militarySpouse}</p>
                      <p className="text-xs text-muted-foreground">MilSp</p>
                    </div>
                    <div className="p-2 rounded bg-background text-center">
                      <p className="font-bold text-sm sm:text-base">{totals.rural}</p>
                      <p className="text-xs text-muted-foreground">Rural</p>
                    </div>
                  </div>
                </div>

                {/* RFP Table */}
                {reportLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : reachReport && reachReport.length > 0 ? (
                  <>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="min-w-[200px]">RFP</TableHead>
                            <TableHead className="whitespace-nowrap">Posted</TableHead>
                            <TableHead className="whitespace-nowrap">Client</TableHead>
                            <TableHead className="text-right whitespace-nowrap">MBE</TableHead>
                            <TableHead className="text-right whitespace-nowrap">WBE</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Sec3</TableHead>
                            <TableHead className="text-right whitespace-nowrap">SBE</TableHead>
                            <TableHead className="text-right whitespace-nowrap">DBE</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Vet</TableHead>
                            <TableHead className="text-right whitespace-nowrap">NA</TableHead>
                            <TableHead className="text-right whitespace-nowrap">LGBTQ</TableHead>
                            <TableHead className="text-right whitespace-nowrap">MilSp</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Rural</TableHead>
                            <TableHead className="text-right font-bold whitespace-nowrap">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedRfps.map((item) => (
                            <TableRow key={item.id} data-testid={`row-rfp-${item.rfpId}`}>
                              <TableCell className="font-medium">
                                <Link href={`/rfp/${encodeURIComponent(item.rfp.jobState)}/${encodeURIComponent(generateClientSlug(item.rfp.clientName || (item.rfp as any).organization?.companyName))}/${item.rfp.slug}`}>
                                  <span className="hover:underline cursor-pointer text-primary line-clamp-1">
                                    {item.rfp.title}
                                  </span>
                                </Link>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-muted-foreground">
                                {item.rfp.createdAt ? format(new Date(item.rfp.createdAt), 'MM/dd/yy') : '-'}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{item.rfp.clientName || '-'}</TableCell>
                              <TableCell className="text-right">{item.minorityOwned || 0}</TableCell>
                              <TableCell className="text-right">{item.womenOwned || 0}</TableCell>
                              <TableCell className="text-right">{item.section3 || 0}</TableCell>
                              <TableCell className="text-right">{item.sbe || 0}</TableCell>
                              <TableCell className="text-right">{item.dbe || 0}</TableCell>
                              <TableCell className="text-right">{item.veteranOwned || 0}</TableCell>
                              <TableCell className="text-right">{item.nativeAmericanOwned || 0}</TableCell>
                              <TableCell className="text-right">{item.lgbtqOwned || 0}</TableCell>
                              <TableCell className="text-right">{item.militarySpouse || 0}</TableCell>
                              <TableCell className="text-right">{item.rural || 0}</TableCell>
                              <TableCell className="text-right font-bold">{item.totalReach || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {hasMoreRfps && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setVisibleRfps(v => v + RFPS_PER_PAGE)}
                          data-testid="button-view-more"
                        >
                          <ChevronDown className="h-4 w-4 mr-2" />
                          View More ({reachReport.length - visibleRfps} remaining)
                        </Button>
                      </div>
                    )}
                  </>
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
