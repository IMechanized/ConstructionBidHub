import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Trophy, 
  TrendingUp, 
  Share2, 
  Download,
  Calendar,
  Building2,
  Users
} from "lucide-react";
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

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'quarterly' | '6-month' | 'all-time'>('quarterly');

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

  return (
    <>
      <Helmet>
        <title>Reach Leaderboard | FindConstructionBids</title>
        <meta name="description" content="View the reach report and leaderboard for construction RFPs by certification type." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="sm" data-testid="button-back-home">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    Reach Leaderboard
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Tracking contractor outreach across all RFPs
                  </p>
                </div>
              </div>
              <Button onClick={handleShare} variant="outline" data-testid="button-share">
                <Share2 className="h-4 w-4 mr-2" />
                Share Report
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)} className="space-y-6">
            <div className="flex items-center justify-between">
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
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card data-testid="card-total-reach">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="text-total-reach">{totals.totalReach.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card data-testid="card-rfp-count">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">RFPs Posted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="text-rfp-count">{reachReport?.length || 0}</div>
                </CardContent>
              </Card>
              <Card data-testid="card-minority-reach">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Minority-owned Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="text-minority-reach">{totals.minorityOwned.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card data-testid="card-women-reach">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Women-owned Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" data-testid="text-women-reach">{totals.womenOwned.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2" data-testid="card-rfp-table">
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
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px]">RFP</TableHead>
                            <TableHead>Posted</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-right">MBE</TableHead>
                            <TableHead className="text-right">WBE</TableHead>
                            <TableHead className="text-right">Sec 3</TableHead>
                            <TableHead className="text-right">SBE</TableHead>
                            <TableHead className="text-right">DBE</TableHead>
                            <TableHead className="text-right">Other</TableHead>
                            <TableHead className="text-right font-bold">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reachReport && reachReport.length > 0 ? (
                            <>
                              {reachReport.map((item) => (
                                <TableRow key={item.id} data-testid={`row-rfp-${item.rfpId}`}>
                                  <TableCell className="font-medium">
                                    <Link href={`/rfp/${item.rfp.jobState}/${item.rfp.slug}`}>
                                      <span className="hover:underline cursor-pointer text-primary">
                                        {item.rfp.title}
                                      </span>
                                    </Link>
                                  </TableCell>
                                  <TableCell>
                                    {item.rfp.createdAt ? format(new Date(item.rfp.createdAt), 'MM/dd/yyyy') : '-'}
                                  </TableCell>
                                  <TableCell>{item.rfp.clientName || '-'}</TableCell>
                                  <TableCell className="text-right">{item.minorityOwned || 0}</TableCell>
                                  <TableCell className="text-right">{item.womenOwned || 0}</TableCell>
                                  <TableCell className="text-right">{item.section3 || 0}</TableCell>
                                  <TableCell className="text-right">{item.sbe || 0}</TableCell>
                                  <TableCell className="text-right">{item.dbe || 0}</TableCell>
                                  <TableCell className="text-right">
                                    {(item.veteranOwned || 0) + (item.nativeAmericanOwned || 0) + 
                                     (item.militarySpouse || 0) + (item.lgbtqOwned || 0) + (item.rural || 0)}
                                  </TableCell>
                                  <TableCell className="text-right font-bold">{item.totalReach || 0}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-muted/50 font-bold" data-testid="row-totals">
                                <TableCell>Total</TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-right">{totals.minorityOwned}</TableCell>
                                <TableCell className="text-right">{totals.womenOwned}</TableCell>
                                <TableCell className="text-right">{totals.section3}</TableCell>
                                <TableCell className="text-right">{totals.sbe}</TableCell>
                                <TableCell className="text-right">{totals.dbe}</TableCell>
                                <TableCell className="text-right">
                                  {totals.veteranOwned + totals.nativeAmericanOwned + 
                                   totals.militarySpouse + totals.lgbtqOwned + totals.rural}
                                </TableCell>
                                <TableCell className="text-right">{totals.totalReach}</TableCell>
                              </TableRow>
                            </>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                No reach data available for this period
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-client-leaderboard">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Client Leaderboard
                  </CardTitle>
                  <CardDescription>
                    Top clients by total contractor reach
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {leaderboardLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : leaderboard && leaderboard.length > 0 ? (
                    <div className="space-y-3">
                      {leaderboard.slice(0, 10).map((entry, index) => (
                        <div
                          key={entry.clientName}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          data-testid={`leaderboard-entry-${index}`}
                        >
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={index === 0 ? "default" : index < 3 ? "secondary" : "outline"}
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                            >
                              {index + 1}
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
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No leaderboard data available
                    </div>
                  )}
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(CERTIFICATION_LABELS).map(([key, label]) => (
                    <div key={key} className="p-4 rounded-lg bg-muted/50 text-center" data-testid={`cert-${key}`}>
                      <p className="text-2xl font-bold">{(totals[key as keyof typeof totals] || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Tabs>
        </main>

        <footer className="border-t bg-card mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} FindConstructionBids. All rights reserved.
              </p>
              <div className="flex gap-4">
                <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
