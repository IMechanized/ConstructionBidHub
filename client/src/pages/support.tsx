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
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Support",
      href: "/support",
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
      <main className="container mx-auto px-6 py-12 flex-1">
        <BreadcrumbNav items={breadcrumbItems} />

        <div className="max-w-4xl">
          <h1 className="text-[2rem] font-bold tracking-[-0.01em] mb-2 mt-6">Support Center</h1>
          <p className="text-muted-foreground mb-10">Get help by email or phone, or browse the FAQ below.</p>

          {/* Contact — horizontal row, not identical centered cards */}
          <div className="border border-border rounded-[8px] divide-y divide-border mb-14">
            <div className="flex items-center gap-5 px-6 py-5">
              <div className="w-9 h-9 rounded-[6px] bg-muted/60 flex items-center justify-center shrink-0">
                <Mail className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.9375rem] font-medium text-foreground">Email Support</p>
                <p className="text-[0.8125rem] text-muted-foreground">Get a response within 24 hours</p>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0 text-[0.8125rem]">
                <a href="mailto:info@findconstructionbids.com">Contact Support</a>
              </Button>
            </div>
            <div className="flex items-center gap-5 px-6 py-5">
              <div className="w-9 h-9 rounded-[6px] bg-muted/60 flex items-center justify-center shrink-0">
                <Phone className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.9375rem] font-medium text-foreground">Phone Support</p>
                <p className="text-[0.8125rem] text-muted-foreground">Speak with a support representative</p>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0 text-[0.8125rem]">
                <a href="tel:+12034956300">Call (203) 495-6300</a>
              </Button>
            </div>
          </div>

          <h2 className="text-[1.375rem] font-semibold mb-6 tracking-[-0.01em]">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="item-1" className="border border-border rounded-[6px] px-5">
              <AccordionTrigger className="text-left hover:no-underline text-[0.9375rem]">
                What are participation goals?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                Participation goals are targets set by agencies or project owners for involving 
                certified firms (such as DBE, MBE, WBE, or other designated groups) in a construction 
                project. Meeting these goals demonstrates a commitment to inclusive contracting and 
                is often required for public projects.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-border rounded-[6px] px-5">
              <AccordionTrigger className="text-left hover:no-underline text-[0.9375rem]">
                What is Good Faith Effort documentation?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                Good Faith Effort (GFE) documentation is a record proving you made genuine, active 
                attempts to meet participation goals. This includes documenting all outreach to 
                certified firms, dates of solicitation, responses received, bid amounts, and reasons 
                for award decisions. Agencies require this documentation to verify compliance.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-border rounded-[6px] px-5">
              <AccordionTrigger className="text-left hover:no-underline text-[0.9375rem]">
                How does the platform help me track solicitations?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                The platform maintains a detailed log of every solicitation you send to qualified firms. 
                You can record the company name, certification status, trade/scope, and date solicited. 
                This creates an audit trail that demonstrates your outreach efforts for compliance 
                reporting.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-border rounded-[6px] px-5">
              <AccordionTrigger className="text-left hover:no-underline text-[0.9375rem]">
                Can I track which firms responded to my solicitations?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                Yes, the platform lets you record whether each solicited firm submitted a bid, 
                the bid amount they provided, and your final award decision. This complete record 
                of responses and non-responses is essential for Good Faith Effort documentation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border border-border rounded-[6px] px-5">
              <AccordionTrigger className="text-left hover:no-underline text-[0.9375rem]">
                How do I verify a firm's certification status?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                The platform allows you to track and document each firm's certification status 
                (such as DBE, MBE, WBE, SBE, etc.). You can maintain records of certification 
                numbers and expiration dates to ensure you're working with currently certified firms.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border border-border rounded-[6px] px-5">
              <AccordionTrigger className="text-left hover:no-underline text-[0.9375rem]">
                What information should I include in my outreach notes?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                Use the notes field to document important details about each outreach attempt, 
                such as method of contact (email, phone, meeting), who you spoke with, reasons 
                a firm declined to bid, or any special considerations. Detailed notes strengthen 
                your Good Faith Effort documentation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border border-border rounded-[6px] px-5">
              <AccordionTrigger className="text-left hover:no-underline text-[0.9375rem]">
                How does this help with compliance reporting?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                By maintaining all your outreach, bid, and award information in one place, you can 
                easily generate comprehensive reports showing your Good Faith Effort. The platform 
                creates a clear, organized record that can be submitted to agencies to demonstrate 
                compliance with participation goals.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border border-border rounded-[6px] px-5">
              <AccordionTrigger className="text-left hover:no-underline text-[0.9375rem]">
                Can I track multiple projects at once?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                Yes, the platform is designed to handle multiple projects simultaneously. Each RFP 
                or project maintains its own separate record of solicitations, responses, and 
                documentation, making it easy to manage compliance across your entire portfolio.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border border-border rounded-[6px] px-5">
              <AccordionTrigger className="text-left hover:no-underline text-[0.9375rem]">
                What's the difference between a bid solicitation and an RFP?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                An RFP (Request for Proposal) is a formal invitation for contractors to submit bids 
                on a project. Bid solicitation refers to the specific outreach you do to qualified 
                and certified firms, inviting them to respond to your RFP. The platform helps you 
                track both the overall RFP and your individual solicitations to certified firms.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border border-border rounded-[6px] px-5">
              <AccordionTrigger className="text-left hover:no-underline text-[0.9375rem]">
                How do I get started documenting my Good Faith Efforts?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                Start by creating an account and setting up your project or RFP. Then, as you reach 
                out to certified firms, add each one to your tracking system with their company name, 
                certification status, and the date you contacted them. Update the record as you 
                receive responses and make award decisions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11" className="border border-border rounded-[6px] px-5">
              <AccordionTrigger className="text-left hover:no-underline text-[0.9375rem]">
                How much does it cost to post an RFP?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                It is free to post an RFP, but $25 to get it featured on the homepage to qualified contractors.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
}
