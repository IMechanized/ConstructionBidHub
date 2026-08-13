import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { LandingPageHeader } from "@/components/landing-page-header";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import SEOHead from "@/components/seo-head";
import {
  Shield,
  FileCheck,
  Building2,
  Clock,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Award,
  Handshake,
  Target,
} from "lucide-react";

export default function AboutPage() {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
  ];

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About FindConstructionBids",
    "description": "Learn how FindConstructionBids helps contractors meet DBE/MBE/WBE participation goals and document Good Faith Efforts with our comprehensive bid management platform.",
    "url": "https://findconstructionbids.com/about",
    "mainEntity": {
      "@type": "Organization",
      "name": "FindConstructionBids",
      "description": "Construction bid management platform helping contractors with compliance documentation and Good Faith Efforts.",
      "url": "https://findconstructionbids.com",
      "foundingDate": "2024",
      "areaServed": "United States",
      "serviceType": ["Construction Bid Management", "Compliance Documentation", "Good Faith Effort Tracking"]
    }
  };

  const trackingFeatures = [
    { label: "Company name & contact info", icon: Building2 },
    { label: "Certification status (DBE, MBE, WBE, etc.)", icon: Award },
    { label: "Trade / scope of work", icon: Target },
    { label: "Solicitation dates & methods", icon: Clock },
    { label: "Bid responses & amounts", icon: FileCheck },
    { label: "Award decisions & reasoning", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="About Us - FindConstructionBids | Construction Bid Compliance Platform"
        description="Learn how FindConstructionBids helps contractors meet DBE, MBE, and WBE participation goals. Streamline Good Faith Effort documentation with our trusted construction bid management platform."
        keywords="about findconstructionbids, construction bid platform, DBE compliance, MBE WBE participation goals, Good Faith Effort documentation, contractor compliance software"
        url="https://findconstructionbids.com/about"
        canonical="https://findconstructionbids.com/about"
        type="website"
        schema={aboutSchema}
      />
      <LandingPageHeader />

      <main className="flex-1">
        <div className="container mx-auto px-6 py-6">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        {/* Hero — typography-led, no gradient background */}
        <section className="pb-16 md:pb-20 pt-4">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight" style={{ letterSpacing: "-0.02em" }}>
                Compliance documentation<br />without the spreadsheet chaos.
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl mb-8">
                FindConstructionBids helps contractors, owners, and agencies efficiently meet participation goals and document Good Faith Efforts — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="default" asChild data-testid="button-get-started">
                  <Link href="/auth">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="default" variant="outline" asChild data-testid="button-learn-more">
                  <Link href="/support">Read the FAQ</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Value pillars — editorial row layout, not identical cards */}
        <section className="py-14 md:py-16 border-t border-border bg-muted/20">
          <div className="container mx-auto px-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-10">What we're built for</h2>
            <div className="grid md:grid-cols-3 gap-10 md:gap-12">
              {[
                {
                  icon: Lightbulb,
                  title: "Efficiency",
                  description: "Streamline your bid solicitation and tracking process. Save hours of manual work with automated outreach management and centralized documentation."
                },
                {
                  icon: Shield,
                  title: "Compliance",
                  description: "Meet DBE, MBE, WBE, and other participation goals with confidence. Our platform helps you demonstrate Good Faith Efforts with complete audit trails."
                },
                {
                  icon: Handshake,
                  title: "Transparency",
                  description: "Maintain clear records of every outreach, response, and award decision. Build trust with agencies and subcontractors through documented processes."
                }
              ].map((pillar, index) => (
                <div key={index} data-testid={`card-pillar-${index}`}>
                  <pillar.icon className="h-5 w-5 text-primary mb-4" />
                  <h3 className="text-base font-semibold text-foreground mb-2">{pillar.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — numbered, not identical cards */}
        <section className="py-14 md:py-16 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">How it works</h2>
              <p className="text-sm text-muted-foreground mb-10">Get started in minutes.</p>
              <div className="space-y-8">
                {[
                  {
                    step: "01",
                    title: "Create your project",
                    description: "Set up your project with participation goals, required certifications, and trade categories. Import existing subcontractor lists or start fresh."
                  },
                  {
                    step: "02",
                    title: "Solicit & track bids",
                    description: "Reach out to qualified firms and track every response. The platform automatically logs dates, methods, and communications for complete documentation."
                  },
                  {
                    step: "03",
                    title: "Generate compliance reports",
                    description: "Export audit-ready Good Faith Effort documentation with one click. Clear records of outreach, responses, and award decisions — ready for any review."
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-8 items-start" data-testid={`step-${index}`}>
                    <span className="text-2xl font-bold text-muted-foreground/40 shrink-0 w-8 text-right leading-none mt-0.5">{item.step}</span>
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Our story + what you can track */}
        <section className="py-14 md:py-16 border-t border-border bg-muted/20">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">Our story</h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed max-w-prose">
                  <p>
                    FindConstructionBids was founded with a simple mission: make compliance documentation easier for construction professionals. We saw contractors struggling with spreadsheets, scattered emails, and incomplete records when trying to demonstrate Good Faith Efforts.
                  </p>
                  <p>
                    Our team of industry experts and technology professionals built a solution that centralizes all outreach activities, automates documentation, and provides clear audit trails for any compliance review.
                  </p>
                  <p className="text-foreground font-medium">
                    Built by contractors, for contractors — we understand your workflow because we've lived it.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-foreground mb-5">What you can track</h3>
                <ul className="space-y-3">
                  {trackingFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3" data-testid={`feature-${index}`}>
                      <feature.icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{feature.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 md:py-16 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="max-w-xl">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                Ready to simplify your compliance?
              </h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Join contractors who have transformed their Good Faith Effort documentation. Free to start.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild data-testid="button-cta-register">
                  <Link href="/auth">
                    Create free account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild data-testid="button-cta-contact">
                  <Link href="/support">Contact us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
