import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import SEOHead from "@/components/seo-head";

export default function DashboardSupportPage() {
  const [location] = useLocation();
  const breadcrumbItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Support",
      href: "/dashboard/support",
    },
  ];

  // Dynamic SEO configuration for the support page
  const seoConfig = {
    title: "Support Center - FindConstructionBids",
    description: "Get help with your construction bidding process. Access our comprehensive support resources, contact our team, and find answers to frequently asked questions.",
    keywords: "construction support, bid help, contractor support, RFP assistance, construction FAQ",
    type: "website" as const,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I create an RFP?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "To create an RFP, log into your government organization account, navigate to the dashboard, and click on the 'Create RFP' button. Follow the guided process to submit your RFP."
          }
        },
        {
          "@type": "Question",
          "name": "How do I submit a bid?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Contractors can submit bids by browsing available RFPs, selecting one of interest, and clicking the 'Submit Bid' button. Ensure all required documentation is included with your submission."
          }
        }
        // Additional FAQ items can be added here
      ]
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SEOHead {...seoConfig} />
      <DashboardSidebar currentPath={location} />
      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-8 mt-14 md:mt-0">
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
                        <a href="mailto:support@findconstructionbids.com">
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
                        <a href="tel:+15551234567">
                          Call Us
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="prose prose-slate max-w-none">
                <h2>Frequently Asked Questions</h2>
                <div className="space-y-6">
                  <div>
                    <h3>How do I create an RFP?</h3>
                    <p>
                      To create an RFP, log into your government organization account,
                      navigate to the dashboard, and click on the "Create RFP" button.
                      Follow the guided process to submit your RFP.
                    </p>
                  </div>

                  <div>
                    <h3>How do I submit a bid?</h3>
                    <p>
                      Contractors can submit bids by browsing available RFPs, selecting
                      one of interest, and clicking the "Submit Bid" button. Ensure all
                      required documentation is included with your submission.
                    </p>
                  </div>

                  <div>
                    <h3>What are the verification requirements?</h3>
                    <p>
                      Contractors must complete the verification process which includes
                      submitting business documentation, licenses, and insurance
                      certificates. Government organizations must verify their department
                      credentials.
                    </p>
                  </div>

                  <div>
                    <h3>How do I manage my team members?</h3>
                    <p>
                      Organization administrators can manage team members through the Team
                      Management section in the dashboard. Here you can invite new members,
                      set roles and permissions, and manage access levels.
                    </p>
                  </div>

                  <div>
                    <h3>Can I update or withdraw my bid?</h3>
                    <p>
                      Yes, you can modify or withdraw your bid before the RFP deadline.
                      Navigate to your submitted bids in the dashboard, select the bid
                      you wish to modify, and use the edit or withdraw options.
                    </p>
                  </div>

                  <div>
                    <h3>How are minority-owned businesses verified?</h3>
                    <p>
                      Minority-owned businesses can submit their certification documentation
                      during the onboarding process. Our team verifies these credentials
                      within 2-3 business days.
                    </p>
                  </div>

                  <div>
                    <h3>What happens after I submit a bid?</h3>
                    <p>
                      After submission, your bid is reviewed by the government organization.
                      You'll receive notifications about bid status changes and can track
                      progress through your dashboard.
                    </p>
                  </div>

                  <div>
                    <h3>How do I track RFP deadlines?</h3>
                    <p>
                      Your dashboard includes a calendar view of all RFP deadlines. You can
                      also set up email notifications for approaching deadlines in your
                      notification preferences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}