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
                    <a href="tel:+12035201544">
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
                  How do I create an RFP?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  To create an RFP, log into your government organization account,
                  navigate to the dashboard, and click on the "Create RFP" button.
                  Follow the guided process to submit your RFP.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How do I submit a bid?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Contractors can submit bids by browsing available RFPs, selecting
                  one of interest, and clicking the "Submit Bid" button. Ensure all
                  required documentation is included with your submission.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What are the verification requirements?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Contractors must complete the verification process which includes
                  submitting business documentation, licenses, and insurance
                  certificates. Government organizations must verify their department
                  credentials.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How do I manage my team members?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Organization administrators can manage team members through the Team
                  Management section in the dashboard. Here you can invite new members,
                  set roles and permissions, and manage access levels.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can I update or withdraw my bid?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, you can modify or withdraw your bid before the RFP deadline.
                  Navigate to your submitted bids in the dashboard, select the bid
                  you wish to modify, and use the edit or withdraw options.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How are minority-owned businesses verified?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Minority-owned businesses can submit their certification documentation
                  during the onboarding process. Our team verifies these credentials
                  within 2-3 business days.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What happens after I submit a bid?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  After submission, your bid is reviewed by the government organization.
                  You'll receive notifications about bid status changes and can track
                  progress through your dashboard.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  How do I track RFP deadlines?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Your dashboard includes a calendar view of all RFP deadlines. You can
                  also set up email notifications for approaching deadlines in your
                  notification preferences.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What are the benefits of boosting my RFP?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    Boosting your RFP provides several key advantages to help you get better results:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Priority Visibility:</strong> Featured RFPs appear at the top of search results and category listings, ensuring maximum exposure</li>
                    <li><strong>More Responses:</strong> Boosted RFPs receive significantly more qualified contractor bids compared to standard listings</li>
                    <li><strong>Faster Matching:</strong> Get matched with qualified contractors faster through enhanced visibility</li>
                    <li><strong>Professional Badge:</strong> Displays a "Featured" badge that shows your commitment to the project and attracts serious bidders</li>
                  </ul>
                  <p className="mt-3">
                    Boosting is especially beneficial for time-sensitive projects or when you need to attract the most qualified contractors in your area.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}