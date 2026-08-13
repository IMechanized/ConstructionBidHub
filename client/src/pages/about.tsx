import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { LandingPageHeader } from "@/components/landing-page-header";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import SEOHead from "@/components/seo-head";
import { 
  Target, 
  Shield, 
  FileCheck, 
  Building2, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Lightbulb,
  Award,
  Handshake
} from "lucide-react";

export default function AboutPage() {
  const breadcrumbItems = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "About",
      href: "/about",
    },
  ];

  const valuePillars = [
    {
      number: "01",
      icon: Lightbulb,
      title: "Efficiency",
      description: "Streamline your bid solicitation and tracking process. Save hours of manual work with automated outreach management and centralized documentation."
    },
    {
      number: "02",
      icon: Shield,
      title: "Compliance",
      description: "Meet DBE, MBE, WBE, and other participation goals with confidence. Our platform helps you demonstrate Good Faith Efforts with complete audit trails."
    },
    {
      number: "03",
      icon: Handshake,
      title: "Transparency",
      description: "Maintain clear records of every outreach, response, and award decision. Build trust with agencies and subcontractors through documented processes."
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Create Your Project",
      description: "Set up your project with participation goals, required certifications, and trade categories. Import existing subcontractor lists or start fresh."
    },
    {
      step: "2",
      title: "Solicit & Track Bids",
      description: "Reach out to qualified firms and track every response. Our platform automatically logs dates, methods, and communications for complete documentation."
    },
    {
      step: "3",
      title: "Generate Compliance Reports",
      description: "Export audit-ready Good Faith Effort documentation with one click. Clear records of outreach, responses, and award decisions — ready for any review."
    }
  ];

  const trackingFeatures = [
    { label: "Company name & contact info", icon: Building2 },
    { label: "Certification status (DBE, MBE, WBE, etc.)", icon: Award },
    { label: "Trade / scope of work", icon: Target },
    { label: "Solicitation dates & methods", icon: Clock },
    { label: "Bid responses & amounts", icon: FileCheck },
    { label: "Award decisions & reasoning", icon: CheckCircle2 },
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
        <div className="container mx-auto px-6 py-8">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="border-b border-border py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl">
              <p className="text-[0.8125rem] font-medium tracking-[0.05em] uppercase text-muted-foreground mb-4">
                Our Mission
              </p>
              <h1 className="text-[2.25rem] md:text-[3rem] font-bold leading-[1.1] tracking-[-0.02em] mb-6 text-foreground">
                Simplifying compliance.<br />Empowering contractors.
              </h1>
              <p className="text-[1.0625rem] text-muted-foreground leading-relaxed mb-8 max-w-[60ch]">
                findconstructionbids.com helps contractors, owners, and agencies efficiently meet 
                participation goals and document Good Faith Efforts — all in one platform built for the trades.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild className="h-11 px-7" data-testid="button-get-started">
                  <Link href="/auth">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-11 px-7" data-testid="button-learn-more">
                  <Link href="/#features">
                    Explore Features
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Value Pillars — editorial rows, not identical cards */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-6">
            <h2 className="text-[0.8125rem] font-medium tracking-[0.05em] uppercase text-muted-foreground mb-12">
              Built for the construction industry
            </h2>
            <div className="divide-y divide-border">
              {valuePillars.map((pillar, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12 py-10 first:pt-0 last:pb-0"
                  data-testid={`card-pillar-${index}`}
                >
                  <div className="flex items-center gap-4 md:block md:w-48 shrink-0">
                    <span className="text-[2.5rem] font-bold text-muted-foreground/30 leading-none tabular-nums">
                      {pillar.number}
                    </span>
                    <div className="md:hidden">
                      <h3 className="text-[1.125rem] font-semibold text-foreground">{pillar.title}</h3>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <pillar.icon className="h-5 w-5 text-primary shrink-0" />
                      <h3 className="text-[1.125rem] font-semibold text-foreground hidden md:block">{pillar.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed max-w-[60ch]">{pillar.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 bg-muted/20 border-b border-border">
          <div className="container mx-auto px-6">
            <h2 className="text-[0.8125rem] font-medium tracking-[0.05em] uppercase text-muted-foreground mb-12">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {howItWorks.map((item, index) => (
                <div key={index} data-testid={`step-${index}`}>
                  <span className="text-[3rem] font-bold text-muted-foreground/25 leading-none block mb-4 tabular-nums">
                    {item.step}
                  </span>
                  <h3 className="text-[1.0625rem] font-semibold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-[0.9375rem] text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story + What You Can Track */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
              <div>
                <h2 className="text-[0.8125rem] font-medium tracking-[0.05em] uppercase text-muted-foreground mb-6">
                  Our story
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed max-w-[60ch]">
                    findconstructionbids.com was founded with a simple mission: to make compliance 
                    documentation easier for construction professionals. We saw contractors struggling 
                    with spreadsheets, scattered emails, and incomplete records when trying to 
                    demonstrate Good Faith Efforts.
                  </p>
                  <p className="leading-relaxed max-w-[60ch]">
                    Our team of industry experts and technology professionals came together to build 
                    a solution that addresses these challenges head-on. The result is a platform that 
                    centralizes all your outreach activities, automates documentation, and provides 
                    clear audit trails for any compliance review.
                  </p>
                  <p className="leading-relaxed font-medium text-foreground max-w-[60ch]">
                    Built by contractors, for contractors — we understand your workflow because 
                    we've lived it.
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-[0.8125rem] font-medium tracking-[0.05em] uppercase text-muted-foreground mb-6">
                  What you can track
                </h3>
                <div className="space-y-3">
                  {trackingFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0" data-testid={`feature-${index}`}>
                      <feature.icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-[0.9375rem] text-foreground">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-primary">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl">
              <h2 className="text-[1.875rem] font-bold text-primary-foreground mb-4 tracking-[-0.01em]">
                Ready to simplify your compliance?
              </h2>
              <p className="text-[1.0625rem] text-primary-foreground/85 mb-8 leading-relaxed">
                Join contractors who have transformed their Good Faith Effort 
                documentation process. Get started today — it's free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" variant="secondary" asChild className="h-11 px-7" data-testid="button-cta-register">
                  <Link href="/auth">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 px-7 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/60"
                  asChild
                  data-testid="button-cta-contact"
                >
                  <Link href="/support">
                    Contact Us
                  </Link>
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
