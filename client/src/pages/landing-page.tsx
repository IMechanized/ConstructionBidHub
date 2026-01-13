import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Footer } from "@/components/ui/footer";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { RfpCard } from "@/components/rfp-card";
import { Loader2, Trophy, ArrowRight } from "lucide-react";
import { isAfter, subHours } from "date-fns";
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
  const twentyFourHoursAgo = subHours(new Date(), 24);
  const newRfps = rfps?.filter(rfp =>
    !rfp.featured &&
    new Date(rfp.deadline) > new Date() &&
    isAfter(new Date(rfp.createdAt), twentyFourHoursAgo)
  ) || [];

  // Only show first 6 RFPs in each section
  const displayedFeaturedRfps = featuredRfps.slice(0, INITIAL_DISPLAY);
  const displayedNewRfps = newRfps.slice(0, INITIAL_DISPLAY);

  return (
    <div className="min-h-screen bg-background">
      <LandingPageHeader />

      {/* Hero Section */}
      <section className="py-8 md:py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-6 px-2">
            Streamline Your Construction Bidding Process
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-5 md:mb-8 max-w-2xl mx-auto px-2">
            Connect government organizations with qualified contractors. Make the bidding process efficient and transparent.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
            <Button asChild size="lg" className="text-base md:text-lg px-8 md:px-8 h-12 md:h-11">
              <Link href="/opportunities/featured">Find RFPs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base md:text-lg px-8 md:px-8 h-12 md:h-11">
              {user ? (
                <Link href="/dashboard">Back to Dashboard</Link>
              ) : (
                <Link href="/auth">Post RFPs</Link>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview Section - only show when 5 or more clients */}
      {leaderboard && leaderboard.length >= 5 && (
      <section className="py-8 md:py-12 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20" data-testid="card-leaderboard-preview">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Leaderboard</CardTitle>
                    <p className="text-sm text-muted-foreground">See which organizations are leading in diverse contractor outreach</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" data-testid="button-view-leaderboard">
                  <Link href="/leaderboard">
                    View Full Leaderboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-2">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div
                      key={entry.clientName}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/80 border"
                      data-testid={`preview-leaderboard-entry-${index}`}
                    >
                      <Badge 
                        variant={index === 0 ? "default" : index < 3 ? "secondary" : "outline"}
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      >
                        {index + 1}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{entry.clientName}</p>
                        <p className="text-xs text-muted-foreground">{entry.totalReach.toLocaleString()} reach</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No leaderboard data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      )}

      {/* Featured RFPs Section */}
      <section className="py-8 md:py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="mb-6 md:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Featured Opportunities</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Premium construction projects hand-picked for qualified contractors</p>
              </div>
              {featuredRfps.length > INITIAL_DISPLAY && (
                <Button variant="outline" size="sm" className="text-xs sm:text-sm md:text-base whitespace-nowrap self-start sm:self-auto" asChild>
                  <Link href="/opportunities/featured">View All</Link>
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : displayedFeaturedRfps.length > 0 ? (
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {displayedFeaturedRfps.map((rfp) => (
                <RfpCard
                  key={rfp.id}
                  rfp={rfp}
                  compact
                  from="featured"
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No featured opportunities available at the moment.
            </p>
          )}
        </div>
      </section>

      {/* New RFPs Section */}
      {newRfps.length > 0 && (
        <section className="py-8 md:py-16 px-4 bg-muted/10">
          <div className="container mx-auto">
            <div className="mb-6 md:mb-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">New Opportunities</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">Fresh projects posted in the last 24 hours</p>
                </div>
                {newRfps.length > INITIAL_DISPLAY && (
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm md:text-base whitespace-nowrap self-start sm:self-auto" asChild>
                    <Link href="/opportunities/new">View All</Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {displayedNewRfps.map((rfp) => (
                <RfpCard
                  key={rfp.id}
                  rfp={rfp}
                  compact
                  isNew
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