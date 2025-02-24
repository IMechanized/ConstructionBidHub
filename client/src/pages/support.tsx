import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageSquare } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Support Center</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Live Chat</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat with us during business hours
                </p>
                <Button variant="outline">
                  Start Chat
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
          </div>
        </div>
      </main>
    </div>
  );
}