import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Building2, GanttChart, Users, CheckCircle } from "lucide-react";
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

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose FindConstructionBids?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Building2 className="h-10 w-10" />}
              title="Government Organizations"
              description="Easily create and manage RFPs, reach qualified contractors"
            />
            <FeatureCard
              icon={<GanttChart className="h-10 w-10" />}
              title="Contractors"
              description="Find relevant projects and submit competitive bids"
            />
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Team Management"
              description="Invite and manage team members with role-based access"
            />
            <FeatureCard
              icon={<CheckCircle className="h-10 w-10" />}
              title="Transparency"
              description="Clear process and communication between all parties"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Bidding Process?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join organizations already using FindConstructionBids to streamline their construction projects.
          </p>
          <Button asChild size="lg">
            <Link href="/auth">Get Started Now</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6 rounded-lg bg-background border">
      <div className="inline-flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}