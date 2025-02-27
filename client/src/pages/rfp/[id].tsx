import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Rfp } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import BidForm from "@/components/bid-form";
import { useState } from "react";
import { useLocation } from "wouter";
import { Avatar } from "@/components/ui/avatar";

export default function RfpPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: rfp, isLoading: loadingRfp } = useQuery<Rfp & {
    organization?: {
      id: number;
      companyName: string;
      logo?: string;
    } | null;
  }>({
    queryKey: [`/api/rfps/${id}`],
  });

  if (loadingRfp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>RFP not found</div>
      </div>
    );
  }

  const isOwner = user?.id === rfp.organizationId;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Organization Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <Avatar className="h-20 w-20 mb-4">
              {rfp.organization?.logo ? (
                <img
                  src={rfp.organization.logo}
                  alt={`${rfp.organization.companyName} logo`}
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl">
                  {rfp.organization?.companyName?.charAt(0)}
                </span>
              )}
            </Avatar>
            <h1 className="text-2xl font-bold mb-2">{rfp.title}</h1>
            <p className="text-muted-foreground mb-2">
              Posted by {rfp.organization?.companyName || "Unknown Organization"}
            </p>
            {rfp.featured && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                Featured
              </span>
            )}
          </div>

          <div className="bg-card rounded-lg border p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Project Details</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">{rfp.description}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Location</h3>
                  <p>{rfp.jobLocation}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Budget</h3>
                  <p>
                    {rfp.budgetMin
                      ? `Minimum $${rfp.budgetMin.toLocaleString()}`
                      : "Not specified"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Important Dates</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Walkthrough: </span>
                      {format(new Date(rfp.walkthroughDate), "PPp")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">RFI Due: </span>
                      {format(new Date(rfp.rfiDate), "PPp")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deadline: </span>
                      {format(new Date(rfp.deadline), "PPp")}
                    </div>
                  </div>
                </div>

                {rfp.certificationGoals && (
                  <div>
                    <h3 className="font-medium mb-2">Certification Goals</h3>
                    <p>{rfp.certificationGoals}</p>
                  </div>
                )}
              </div>

              {rfp.portfolioLink && (
                <div>
                  <h3 className="font-medium mb-2">Additional Resources</h3>
                  <a
                    href={rfp.portfolioLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Portfolio
                  </a>
                </div>
              )}
            </div>
          </div>

          {!isOwner && (
            user ? (
              <Button
                className="w-full"
                size="lg"
                onClick={() => setIsBidModalOpen(true)}
              >
                Submit Bid
              </Button>
            ) : (
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => setLocation('/auth')}
              >
                Login to Submit Bid
              </Button>
            )
          )}
        </div>

        {user && !isOwner && (
          <Dialog open={isBidModalOpen} onOpenChange={setIsBidModalOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Submit Your Bid</DialogTitle>
              </DialogHeader>
              <BidForm
                rfpId={Number(id)}
                onSuccess={() => setIsBidModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}