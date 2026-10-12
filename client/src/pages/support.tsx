import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { LandingPageHeader } from "@/components/landing-page-header";
import { Footer } from "@/components/ui/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function SupportPage() {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Support", href: "/support" },
  ];

  const faqs = [
    {
      q: "What are participation goals?",
      a: "Participation goals are targets set by agencies or project owners for involving certified firms (such as DBE, MBE, WBE, or other designated groups) in a construction project. Meeting these goals demonstrates a commitment to inclusive contracting and is often required for public projects."
    },
    {
      q: "What is Good Faith Effort documentation?",
      a: "Good Faith Effort (GFE) documentation is a record proving you made genuine, active attempts to meet participation goals. This includes documenting all outreach to certified firms, dates of solicitation, responses received, bid amounts, and reasons for award decisions. Agencies require this documentation to verify compliance."
    },
    {
      q: "How does the platform help me track solicitations?",
      a: "The platform maintains a detailed log of every solicitation you send to qualified firms. You can record the company name, certification status, trade/scope, and date solicited. This creates an audit trail that demonstrates your outreach efforts for compliance reporting."
    },
    {
      q: "Can I track which firms responded to my solicitations?",
      a: "Yes. The platform lets you record whether each solicited firm submitted a bid, the bid amount they provided, and your final award decision. This complete record of responses and non-responses is essential for Good Faith Effort documentation."
    },
    {
      q: "How do I verify a firm's certification status?",
      a: "The platform allows you to track and document each firm's certification status (such as DBE, MBE, WBE, SBE, etc.). You can maintain records of certification numbers and expiration dates to ensure you're working with currently certified firms."
    },
    {
      q: "What information should I include in my outreach notes?",
      a: "Use the notes field to document important details about each outreach attempt, such as method of contact (email, phone, meeting), who you spoke with, reasons a firm declined to bid, or any special considerations. Detailed notes strengthen your Good Faith Effort documentation."
    },
    {
      q: "How does this help with compliance reporting?",
      a: "By maintaining all your outreach, bid, and award information in one place, you can easily generate comprehensive reports showing your Good Faith Effort. The platform creates a clear, organized record that can be submitted to agencies to demonstrate compliance with participation goals."
    },
    {
      q: "Can I track multiple projects at once?",
      a: "Yes. The platform is designed to handle multiple projects simultaneously. Each RFP or project maintains its own separate record of solicitations, responses, and documentation, making it easy to manage compliance across your entire portfolio."
    },
    {
      q: "What's the difference between a bid solicitation and an RFP?",
      a: "An RFP (Request for Proposal) is a formal invitation for contractors to submit bids on a project. Bid solicitation refers to the specific outreach you do to qualified and certified firms, inviting them to respond to your RFP. The platform helps you track both the overall RFP and your individual solicitations to certified firms."
    },
    {
      q: "How do I get started documenting my Good Faith Efforts?",
      a: "Start by creating an account and setting up your project or RFP. Then, as you reach out to certified firms, add each one to your tracking system with their company name, certification status, and the date you contacted them. Update the record as you receive responses and make award decisions."
    },
    {
      q: "How much does it cost to post an RFP?",
      a: "It is free to post an RFP. Featured placement on the homepage — which increases visibility with qualified contractors — is $25."
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Support - FindConstructionBids"
        description="Get help with FindConstructionBids. Browse FAQs, contact our support team, and find answers to common questions about our platform."
        canonical="https://findconstructionbids.com/support"
      />
      <LandingPageHeader />

      <main className="flex-1">
        <div className="container mx-auto px-6 py-6">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        {/* Page header */}
        <section className="pb-12 pt-2">
          <div className="container mx-auto px-6 max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3" style={{ letterSpacing: "-0.02em" }}>
              Support
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Browse the FAQ below, or reach out to us directly.
            </p>
          </div>
        </section>

        {/* Contact channels — horizontal, not card grid */}
        <section className="border-t border-border py-10">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Email</h3>
                  <p className="text-sm text-muted-foreground mb-2">Response within 24 hours</p>
                  <a
                    href="mailto:info@findconstructionbids.com"
                    className="text-sm text-primary hover:underline"
                  >
                    info@findconstructionbids.com
                  </a>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Phone</h3>
                  <p className="text-sm text-muted-foreground mb-2">Speak with our team</p>
                  <a
                    href="tel:+12034956300"
                    className="text-sm text-primary hover:underline"
                  >
                    (203) 495-6300
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border py-12">
          <div className="container mx-auto px-6 max-w-3xl">
            <h2 className="text-lg font-semibold text-foreground mb-6">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="space-y-1">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index + 1}`}
                  className="border border-border rounded-md px-4 data-[state=open]:bg-muted/30 transition-colors"
                >
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3.5 text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed max-w-prose">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
