import { useAuth } from "@/hooks/use-auth";
import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Footer } from "@/components/ui/footer";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { RfpCard } from "@/components/rfp-card";
import { Loader2, Trophy, ArrowRight } from "lucide-react";
import { LandingPageHeader } from "@/components/landing-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  clientName: string;
  totalReach: number;
  rfpCount: number;
}

const INITIAL_DISPLAY = 6; // 3x2 grid

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/reports/leaderboard'],
  });

  const featuredRfps = rfps?.filter(rfp => 
    rfp.featured && new Date(rfp.deadline) > new Date()
  ) || [];
  
  const newRfps = rfps?.filter(rfp =>
    !rfp.featured &&
    new Date(rfp.deadline) > new Date()
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const newestRfpIds = new Set(newRfps.slice(0, 12).map(rfp => rfp.id));

  const displayedFeaturedRfps = featuredRfps.slice(0, INITIAL_DISPLAY);
  const displayedNewRfps = newRfps.slice(0, INITIAL_DISPLAY);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="FindConstructionBids - Construction Bid Management Platform"
        description="Find and manage construction bids, RFPs, and contractor opportunities. Connect with qualified contractors and streamline your bidding process."
        canonical="https://findconstructionbids.com/"
      />
      <LandingPageHeader />

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 border-b border-border">
        <div className="container mx-auto">
          <div className="max-w-3xl">
            <p className="text-[0.8125rem] font-medium tracking-[0.05em] uppercase text-muted-foreground mb-4">
              Government Construction Marketplace
            </p>
            <h1 className="text-[2.25rem] sm:text-[2.75rem] md:text-[3.5rem] font-bold leading-[1.1] tracking-[-0.02em] mb-6 text-foreground">
              Every open construction bid,<br className="hidden sm:block" /> one place.
            </h1>
            <p className="text-[1.0625rem] text-muted-foreground leading-relaxed mb-8 max-w-[56ch]">
              Government-issued RFPs for construction and services, posted by agencies and searchable by trade, jurisdiction, and deadline. Know what's out there before your competitors do.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="h-11 px-7 text-[0.9375rem] font-medium">
                <Link href="/opportunities/featured">Browse Opportunities</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-7 text-[0.9375rem]">
                {user ? (
                  <Link href="/dashboard">Go to Dashboard</Link>
                ) : (
                  <Link href="/auth">Post an RFP</Link>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview Section - only show when 5 or more clients */}
      {leaderboard && leaderboard.length >= 5 && (
        <section className="py-10 md:py-14 px-4 border-b border-border">
          <div className="container mx-auto">
            <Card className="bg-card border-border" data-testid="card-leaderboard-preview">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-[oklch(62%_0.15_85)]" />
                    <div>
                      <CardTitle className="text-[1.0625rem] font-semibold">Contractor Leaderboard</CardTitle>
                      <p className="text-[0.8125rem] text-muted-foreground mt-0.5">Organizations leading in diverse contractor outreach</p>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-[0.8125rem]" data-testid="button-view-leaderboard">
                    <Link href="/leaderboard">
                      View full rankings
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : leaderboard && leaderboard.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-1">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div
                        key={entry.clientName}
                        className="flex items-center gap-3 p-3 rounded-[6px] bg-muted/40 border border-border"
                        data-testid={`preview-leaderboard-entry-${index}`}
                      >
                        <Badge 
                          variant={index === 0 ? "default" : index < 3 ? "secondary" : "outline"}
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[0.75rem] p-0"
                        >
                          {index + 1}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[0.8125rem] truncate">{entry.clientName}</p>
                          <p className="text-[0.75rem] text-muted-foreground">{entry.totalReach.toLocaleString()} reach</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[0.875rem] text-muted-foreground py-3">No leaderboard data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Featured RFPs Section */}
      {(isLoading || featuredRfps.length > 0) && (
        <section className="py-12 md:py-20 px-4 bg-muted/20 border-b border-border">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 md:mb-10">
              <div>
                <h2 className="text-[1.5rem] md:text-[1.875rem] font-bold tracking-[-0.01em] mb-1.5">Featured Opportunities</h2>
                <p className="text-[0.875rem] text-muted-foreground">Boosted bids from active agencies</p>
              </div>
              {featuredRfps.length > INITIAL_DISPLAY && (
                <Button variant="outline" size="sm" className="text-[0.8125rem] whitespace-nowrap shrink-0" asChild>
                  <Link href="/opportunities/featured">
                    View all {featuredRfps.length}
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {displayedFeaturedRfps.map((rfp) => (
                  <RfpCard
                    key={rfp.id}
                    rfp={rfp}
                    compact
                    from="featured"
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* New RFPs Section */}
      {newRfps.length > 0 && (
        <section className="py-12 md:py-20 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 md:mb-10">
              <div>
                <h2 className="text-[1.5rem] md:text-[1.875rem] font-bold tracking-[-0.01em] mb-1.5">New Opportunities</h2>
                <p className="text-[0.875rem] text-muted-foreground">Recently posted, sorted newest first</p>
              </div>
              {newRfps.length > INITIAL_DISPLAY && (
                <Button variant="outline" size="sm" className="text-[0.8125rem] whitespace-nowrap shrink-0" asChild>
                  <Link href="/opportunities/new">
                    View all {newRfps.length}
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              )}
            </div>
            <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {displayedNewRfps.map((rfp) => (
                <RfpCard
                  key={rfp.id}
                  rfp={rfp}
                  compact
                  isNew={newestRfpIds.has(rfp.id)}
                  from="new"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
