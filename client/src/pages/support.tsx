import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";

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

              <div>
                <h3>What are the benefits of boosting my RFP?</h3>
                <p>
                  Boosting your RFP provides several key advantages to help you get better results:
                </p>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                  <li><strong>Priority Visibility:</strong> Featured RFPs appear at the top of search results and category listings, ensuring maximum exposure</li>
                  <li><strong>More Responses:</strong> Boosted RFPs receive significantly more qualified contractor bids compared to standard listings</li>
                  <li><strong>Faster Matching:</strong> Get matched with qualified contractors faster through enhanced visibility</li>
                  <li><strong>Professional Badge:</strong> Displays a "Featured" badge that shows your commitment to the project and attracts serious bidders</li>
                </ul>
                <p className="mt-2">
                  Boosting is especially beneficial for time-sensitive projects or when you need to attract the most qualified contractors in your area.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}