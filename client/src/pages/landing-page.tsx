import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Footer } from "@/components/ui/footer";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { RfpCard } from "@/components/rfp-card";
import { Loader2 } from "lucide-react";
import { isAfter, subHours } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";
import { OfflineIndicator, OfflineBanner } from "@/components/offline-status";

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
      {/* Navigation */}
      <nav className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-bold hover:text-primary transition-colors">
            FindConstructionBids
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Support
            </Link>
            <OfflineIndicator />
            <ThemeToggle size="sm" />
            <Button asChild variant="outline" size="sm" className="md:text-base">
              {user ? (
                <Link href="/dashboard">Dashboard</Link>
              ) : (
                <Link href="/auth">Get Started</Link>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Offline Banner - Shows only when offline */}
      <div className="container mx-auto px-4 mt-4">
        <OfflineBanner />
      </div>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6">
            Streamline Your Construction Bidding Process
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
            Connect government organizations with qualified contractors. Make the bidding process efficient and transparent.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="text-base md:text-lg px-6 md:px-8">
              <Link href="/opportunities/featured">Find RFPs</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base md:text-lg px-6 md:px-8">
              {user ? (
                <Link href="/dashboard">Back to Dashboard</Link>
              ) : (
                <Link href="/auth">Post RFPs</Link>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Featured RFPs Section */}
      <section className="py-12 md:py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">Featured Opportunities</h2>
            {featuredRfps.length > INITIAL_DISPLAY && (
              <Button variant="outline" size="sm" className="md:text-base" asChild>
                <Link href="/opportunities/featured">View All Featured</Link>
              </Button>
            )}
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
        <section className="py-12 md:py-16 px-4 bg-muted/10">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold">New Opportunities</h2>
              {newRfps.length > INITIAL_DISPLAY && (
                <Button variant="outline" size="sm" className="md:text-base" asChild>
                  <Link href="/opportunities/new">View All New</Link>
                </Button>
              )}
            </div>
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {displayedNewRfps.map((rfp) => (
                <RfpCard
                  key={rfp.id}
                  rfp={rfp}
                  compact
                  isNew
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