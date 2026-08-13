import { useAuth } from "@/hooks/use-auth";
import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Footer } from "@/components/ui/footer";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { RfpCard } from "@/components/rfp-card";
import { Loader2, Trophy, ArrowRight, CheckCircle2 } from "lucide-react";
import { LandingPageHeader } from "@/components/landing-page-header";
import { Badge } from "@/components/ui/badge";
import { generateClientSlug } from "@/lib/utils";

interface LeaderboardEntry {
  clientName: string;
  totalReach: number;
  rfpCount: number;
}

const INITIAL_DISPLAY = 6;

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
        title="FindConstructionBids - Government Construction & Services Opportunities"
        description="A marketplace for government-issued construction and services opportunities. Filter by trade, jurisdiction, and deadline — then bid with confidence."
        keywords="government construction bids, RFP marketplace, construction opportunities, government RFP, contractor bidding, public construction projects, bid platform"
        canonical="https://findconstructionbids.com/"
        schema={
          displayedFeaturedRfps.length > 0 || displayedNewRfps.length > 0
            ? {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Government Construction & Services Opportunities",
                "description": "Browse government-issued RFPs and construction opportunities. Featured and new listings updated daily.",
                "url": "https://findconstructionbids.com/",
                "itemListElement": [
                  ...displayedFeaturedRfps.map((rfp, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "name": rfp.title,
                    "url": `https://findconstructionbids.com/rfp/${encodeURIComponent(rfp.jobState)}/${encodeURIComponent(generateClientSlug(rfp.clientName))}/${rfp.slug || rfp.id}`,
                  })),
                  ...displayedNewRfps.map((rfp, i) => ({
                    "@type": "ListItem",
                    "position": displayedFeaturedRfps.length + i + 1,
                    "name": rfp.title,
                    "url": `https://findconstructionbids.com/rfp/${encodeURIComponent(rfp.jobState)}/${encodeURIComponent(generateClientSlug(rfp.clientName))}/${rfp.slug || rfp.id}`,
                  })),
                ],
              }
            : undefined
        }
      />
      <LandingPageHeader />

      {/* Hero Section */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4 text-foreground" style={{ letterSpacing: "-0.02em" }}>
              Find the work before your competition does.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
              A marketplace for government-issued construction and services opportunities. Filter by trade, jurisdiction, and deadline — then bid with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="h-11 px-8 text-sm font-medium">
                <Link href="/opportunities/featured">Browse Opportunities</Link>
              </Button>
              {!user && (
                <Button asChild size="lg" variant="outline" className="h-11 px-8 text-sm font-medium">
                  <Link href="/auth">Post an RFP</Link>
                </Button>
              )}
              {user && (
                <Button asChild size="lg" variant="outline" className="h-11 px-8 text-sm font-medium">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Value propositions — horizontal row, no cards */}
          <div className="mt-14 pt-10 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            {[
              { label: "Updated daily", sub: "Fresh opportunities from public agencies across the country." },
              { label: "Free to browse", sub: "Create an account to save searches and get deadline alerts." },
              { label: "Featured placement", sub: "Reach more contractors by featuring your RFP on the homepage." },
            ].map((item) => (
              <div key={item.label} className="flex gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">{item.label}</span>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview Section */}
      {leaderboard && leaderboard.length >= 5 && (
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <div>
                  <h2 className="text-base font-semibold text-foreground">Leaderboard</h2>
                  <p className="text-sm text-muted-foreground">Organizations leading in diverse contractor outreach</p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground" data-testid="button-view-leaderboard">
                <Link href="/leaderboard">
                  View full leaderboard
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>

            {leaderboardLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-1" data-testid="card-leaderboard-preview">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div
                    key={entry.clientName}
                    className="flex items-center gap-4 py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors"
                    data-testid={`preview-leaderboard-entry-${index}`}
                  >
                    <span className="text-sm font-medium text-muted-foreground w-5 text-right shrink-0">{index + 1}</span>
                    <span className="font-medium text-sm text-foreground flex-1 truncate">{entry.clientName}</span>
                    <Badge variant="secondary" className="text-xs font-normal shrink-0">
                      {entry.totalReach.toLocaleString()} reach
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No leaderboard data yet</p>
            )}
          </div>
        </section>
      )}

      {/* Featured RFPs Section */}
      {(isLoading || featuredRfps.length > 0) && (
        <section className="py-14 md:py-20 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4 mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-1">Featured Opportunities</h2>
                <p className="text-sm text-muted-foreground">Premium projects, hand-picked for qualified contractors</p>
              </div>
              {featuredRfps.length > INITIAL_DISPLAY && (
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground shrink-0" asChild>
                  <Link href="/opportunities/featured">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {displayedFeaturedRfps.map((rfp) => (
                  <RfpCard key={rfp.id} rfp={rfp} compact from="featured" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* New RFPs Section */}
      {newRfps.length > 0 && (
        <section className="py-14 md:py-20 px-4 bg-muted/20">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4 mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-1">New Opportunities</h2>
                <p className="text-sm text-muted-foreground">Latest listings, sorted by most recent</p>
              </div>
              {newRfps.length > INITIAL_DISPLAY && (
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground shrink-0" asChild>
                  <Link href="/opportunities/new">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              )}
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
