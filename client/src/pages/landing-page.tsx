import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Footer } from "@/components/ui/footer";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { RfpCard } from "@/components/rfp-card";
import { Loader2 } from "lucide-react";
import { isAfter, subHours } from "date-fns";
import { LandingPageHeader } from "@/components/landing-page-header";

const INITIAL_DISPLAY = 6; // 3x2 grid

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const featuredRfps = rfps?.filter(rfp => rfp.featured) || [];
  const twentyFourHoursAgo = subHours(new Date(), 24);
  const newRfps = rfps?.filter(rfp =>
    !rfp.featured &&
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
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/leaderboard" className="text-primary hover:underline" data-testid="link-leaderboard">
              View Reach Leaderboard
            </Link>
          </p>
        </div>
      </section>

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