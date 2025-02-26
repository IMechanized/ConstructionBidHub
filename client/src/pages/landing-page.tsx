import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Footer } from "@/components/ui/footer";

export default function LandingPage() {
  const { user } = useAuth();

  // If user is logged in, redirect to dashboard
  if (user) {
    return <Link to="/dashboard" />;
  }

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

      <Footer />
    </div>
  );
}