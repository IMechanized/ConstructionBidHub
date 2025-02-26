import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Footer } from "@/components/ui/footer";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { RfpCard } from "@/components/rfp-card";
import { Loader2 } from "lucide-react";

const INITIAL_DISPLAY = 6; // 3x2 grid
const EXPANDED_DISPLAY = 12; // 3x4 grid when expanded

export default function LandingPage() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isExpanded ? EXPANDED_DISPLAY : INITIAL_DISPLAY;

  // If user is logged in, redirect to dashboard
  if (user) {
    return <Link to="/dashboard" />;
  }

  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  const featuredRfps = rfps?.filter(rfp => rfp.featured) || [];
  const totalPages = Math.ceil(featuredRfps.length / itemsPerPage);
  const displayedRfps = featuredRfps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold">FindConstructionBids</span>
          <Button asChild variant="outline">
            <Link href="/auth">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Streamline Your Construction Bidding Process
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect government organizations with qualified contractors. Make the bidding process efficient and transparent.
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/auth">Join Now</Link>
          </Button>
        </div>
      </section>

      {/* Featured RFPs Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Opportunities</h2>

          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : featuredRfps.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayedRfps.map((rfp) => (
                  <RfpCard
                    key={rfp.id}
                    rfp={rfp}
                    compact
                  />
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center gap-4">
                {!isExpanded && featuredRfps.length > INITIAL_DISPLAY && (
                  <Button
                    variant="outline"
                    onClick={() => setIsExpanded(true)}
                    className="w-full max-w-xs"
                  >
                    View More
                  </Button>
                )}

                {isExpanded && totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground">
              No featured opportunities available at the moment.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}