import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, ChevronDown } from "lucide-react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
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
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12">
        <BreadcrumbNav items={breadcrumbItems} />
        <h1 className="text-4xl font-bold mb-8">Support Center</h1>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get help via email within 24 hours
                  </p>
                  <Button variant="outline">
                    <a href="mailto:info@findconstructionbids.com">
                      Contact Support
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Phone className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Speak with a support representative
                  </p>
                  <Button variant="outline">
                    <a href="tel:+12034956300">
                      Call Us
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What are participation goals?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Participation goals are targets set by agencies or project owners for involving 
                  certified firms (such as DBE, MBE, WBE, or other designated groups) in a construction 
                  project. Meeting these goals demonstrates a commitment to inclusive contracting and 
                  is often required for public projects.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What is Good Faith Effort documentation?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Good Faith Effort (GFE) documentation is a record proving you made genuine, active 
                  attempts to meet participation goals. This includes documenting all outreach to 
                  certified firms, dates of solicitation, responses received, bid amounts, and reasons 
                  for award decisions. Agencies require this documentation to verify compliance.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How does the platform help me track solicitations?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  The platform maintains a detailed log of every solicitation you send to qualified firms. 
                  You can record the company name, certification status, trade/scope, and date solicited. 
                  This creates an audit trail that demonstrates your outreach efforts for compliance 
                  reporting.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can I track which firms responded to my solicitations?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, the platform lets you record whether each solicited firm submitted a bid, 
                  the bid amount they provided, and your final award decision. This complete record 
                  of responses and non-responses is essential for Good Faith Effort documentation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How do I verify a firm's certification status?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  The platform allows you to track and document each firm's certification status 
                  (such as DBE, MBE, WBE, SBE, etc.). You can maintain records of certification 
                  numbers and expiration dates to ensure you're working with currently certified firms.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What information should I include in my outreach notes?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Use the notes field to document important details about each outreach attempt, 
                  such as method of contact (email, phone, meeting), who you spoke with, reasons 
                  a firm declined to bid, or any special considerations. Detailed notes strengthen 
                  your Good Faith Effort documentation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How does this help with compliance reporting?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  By maintaining all your outreach, bid, and award information in one place, you can 
                  easily generate comprehensive reports showing your Good Faith Effort. The platform 
                  creates a clear, organized record that can be submitted to agencies to demonstrate 
                  compliance with participation goals.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can I track multiple projects at once?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, the platform is designed to handle multiple projects simultaneously. Each RFP 
                  or project maintains its own separate record of solicitations, responses, and 
                  documentation, making it easy to manage compliance across your entire portfolio.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What's the difference between a bid solicitation and an RFP?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  An RFP (Request for Proposal) is a formal invitation for contractors to submit bids 
                  on a project. Bid solicitation refers to the specific outreach you do to qualified 
                  and certified firms, inviting them to respond to your RFP. The platform helps you 
                  track both the overall RFP and your individual solicitations to certified firms.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How do I get started documenting my Good Faith Efforts?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Start by creating an account and setting up your project or RFP. Then, as you reach 
                  out to certified firms, add each one to your tracking system with their company name, 
                  certification status, and the date you contacted them. Update the record as you 
                  receive responses and make award decisions.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}