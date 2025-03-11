import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Rfp } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import RfiForm from "@/components/bid-form";
import { useState } from "react";
import { useLocation } from "wouter";
import { Avatar } from "@/components/ui/avatar";
import { Download } from "lucide-react";
import html2pdf from 'html2pdf.js';

export default function RfpPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [isRfiModalOpen, setIsRfiModalOpen] = useState(false);
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

  const handleDownload = () => {
    const element = document.getElementById('rfp-content');
    const opt = {
      margin: 1,
      filename: `${rfp?.title}-rfp.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Hide buttons before generating PDF
    const bidButton = document.getElementById('bid-button');
    const downloadButton = document.getElementById('download-button');
    if (bidButton) bidButton.style.display = 'none';
    if (downloadButton) downloadButton.style.display = 'none';

    html2pdf().set(opt).from(element).save().then(() => {
      // Restore buttons after PDF generation
      if (bidButton) bidButton.style.display = 'block';
      if (downloadButton) downloadButton.style.display = 'block';
    });
  };

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
  const breadcrumbItems = user
    ? [
        {
          label: "Dashboard",
          href: "/dashboard",
        },
        {
          label: rfp.title || "RFP Details",
          href: `/rfp/${id}`,
        },
      ]
    : [
        {
          label: rfp.featured ? "Featured Opportunities" : "New Opportunities",
          href: "/",
        },
        {
          label: rfp.title || "RFP Details",
          href: `/rfp/${id}`,
        },
      ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <BreadcrumbNav items={breadcrumbItems} />
          <div id="download-button">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download RFP
            </Button>
          </div>
        </div>

        <div id="rfp-content" className="max-w-4xl mx-auto">
          {/* Important Dates Section */}
          <div className="mb-8 text-right text-sm text-muted-foreground">
            <div>Posted: {format(new Date(rfp.createdAt), "MMMM d, yyyy")}</div>
            <div>RFI Due: {format(new Date(rfp.rfiDate), "MMMM d, yyyy")}</div>
            <div>Deadline: {format(new Date(rfp.deadline), "MMMM d, yyyy")}</div>
          </div>

          <hr className="my-6 border-muted" />

          {/* Title and Organization Section */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{rfp.title}</h1>
            <p className="text-muted-foreground mt-2">
              {rfp.organization?.companyName || "Unknown Organization"}
            </p>
          </div>

          <hr className="my-6 border-muted" />

          {/* Project Overview */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Project Overview</h2>
            <p className="text-justify leading-relaxed">{rfp.description}</p>
          </div>

          <hr className="my-6 border-muted" />

          {/* Project Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Project Details</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-medium mb-2">Location</h3>
                <p>{rfp.jobLocation}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Budget</h3>
                <p>
                  {rfp.budgetMin
                    ? `$${rfp.budgetMin.toLocaleString()}`
                    : "Not specified"}
                </p>
              </div>
            </div>
          </div>

          <hr className="my-6 border-muted" />

          {/* Schedule */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Project Schedule</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Site Walkthrough: </span>
                {format(new Date(rfp.walkthroughDate), "MMMM d, yyyy 'at' h:mm a")}
              </div>
              <div>
                <span className="font-medium">RFI Submission Deadline: </span>
                {format(new Date(rfp.rfiDate), "MMMM d, yyyy 'at' h:mm a")}
              </div>
              <div>
                <span className="font-medium">Proposal Due Date: </span>
                {format(new Date(rfp.deadline), "MMMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          </div>

          {rfp.certificationGoals && (
            <>
              <hr className="my-6 border-muted" />
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Certification Requirements</h2>
                <p className="text-justify">{rfp.certificationGoals}</p>
              </div>
            </>
          )}

          {rfp.portfolioLink && (
            <>
              <hr className="my-6 border-muted" />
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Additional Resources</h2>
                <a
                  href={rfp.portfolioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Portfolio Documents
                </a>
              </div>
            </>
          )}
        </div>

        {/* Bid Button - Outside of downloadable content */}
        {!isOwner && (
          <div id="bid-button" className="flex justify-center mt-12">
            {user ? (
              <Button size="lg" onClick={() => setIsRfiModalOpen(true)}>
                Submit Bid Request
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/auth")}
              >
                Login to Submit Bid
              </Button>
            )}
          </div>
        )}

        {user && !isOwner && (
          <Dialog open={isRfiModalOpen} onOpenChange={setIsRfiModalOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Submit Bid Request</DialogTitle>
              </DialogHeader>
              <RfiForm
                rfpId={Number(id)}
                onSuccess={() => setIsRfiModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}