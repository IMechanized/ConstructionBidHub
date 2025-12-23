import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { LandingPageHeader } from "@/components/landing-page-header";
import { Footer } from "@/components/ui/footer";
import { Card, CardContent } from "@/components/ui/card";
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

        <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Simplifying Compliance, Empowering Contractors
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                findconstructionbids.com helps contractors, owners, and agencies efficiently meet 
                participation goals and document Good Faith Efforts — all in one powerful platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild data-testid="button-get-started">
                  <Link href="/auth">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                  <Link href="/#features">
                    Explore Features
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Built for the Construction Industry</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We understand the unique challenges contractors face when meeting participation 
                requirements. Our platform is designed from the ground up to address these needs.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {valuePillars.map((pillar, index) => (
                <Card key={index} className="border-2 hover:border-primary/50 transition-colors" data-testid={`card-pillar-${index}`}>
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                      <pillar.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{pillar.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get started in minutes. Our streamlined process makes compliance documentation 
                simple and stress-free.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {howItWorks.map((item, index) => (
                <div key={index} className="relative" data-testid={`step-${index}`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-6">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-primary/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    findconstructionbids.com was founded with a simple mission: to make compliance 
                    documentation easier for construction professionals. We saw contractors struggling 
                    with spreadsheets, scattered emails, and incomplete records when trying to 
                    demonstrate Good Faith Efforts.
                  </p>
                  <p className="leading-relaxed">
                    Our team of industry experts and technology professionals came together to build 
                    a solution that addresses these challenges head-on. The result is a platform that 
                    centralizes all your outreach activities, automates documentation, and provides 
                    clear audit trails for any compliance review.
                  </p>
                  <p className="leading-relaxed font-medium text-foreground">
                    Built by contractors, for contractors — we understand your workflow because 
                    we've lived it.
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-primary/5 to-primary/15 rounded-2xl p-8 md:p-10">
                <h3 className="text-xl font-semibold mb-6">What You Can Track</h3>
                <div className="space-y-4">
                  {trackingFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-4" data-testid={`feature-${index}`}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-foreground">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Simplify Your Compliance?</h2>
              <p className="text-lg opacity-90 mb-8">
                Join thousands of contractors who have transformed their Good Faith Effort 
                documentation process. Get started today — it's free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild data-testid="button-cta-register">
                  <Link href="/auth">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild data-testid="button-cta-contact">
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
