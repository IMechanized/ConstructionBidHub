import { useEffect, useRef } from "react";
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
import EditRfpForm from "@/components/edit-rfp-form";
import DeleteRfpDialog from "@/components/delete-rfp-dialog";
import { useState } from "react";
import { useLocation } from "wouter";
import { Avatar } from "@/components/ui/avatar";
import { Download, Edit, Trash2 } from "lucide-react";
import html2pdf from 'html2pdf.js';
import { apiRequest } from "@/lib/queryClient";

export default function RfpPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [isRfiModalOpen, setIsRfiModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  const viewStartTime = useRef<number>(Date.now());
  const hasTrackedView = useRef<boolean>(false);

  const { data: rfp, isLoading: loadingRfp } = useQuery<Rfp & {
    organization?: {
      id: number;
      companyName: string;
      logo?: string;
    } | null;
  }>({
    queryKey: [`/api/rfps/${id}`],
  });
  
  // Track view time when user leaves the page or when component unmounts
  useEffect(() => {
    // Reset view time tracker when the component mounts
    viewStartTime.current = Date.now();
    hasTrackedView.current = false;
    
    // Skip tracking if we don't have RFP data or user isn't logged in
    if (!user || !rfp) {
      console.log(`View tracking skipped - missing data: User=${!!user}, RFP=${!!rfp}`);
      return;
    }
    
    // Double-check permission - only track if user is logged in and not the owner of the RFP
    const shouldTrackView = user.id !== rfp.organizationId;
    console.log(`View tracking eligibility check: User ID=${user.id}, RFP Owner ID=${rfp.organizationId}, Should track=${shouldTrackView}`);
    
    // Skip if user is the owner
    if (!shouldTrackView) {
      console.log('View tracking not applicable - user is RFP owner');
      return;
    }
    
    const trackViewDuration = async () => {
      if (hasTrackedView.current) {
        console.log('View already tracked for this session, skipping');
        return;
      }
      
      try {
        const duration = Math.floor((Date.now() - viewStartTime.current) / 1000); // Convert to seconds
        
        // Only track if the user spent at least 3 seconds on the page (to filter out accidental clicks)
        if (duration >= 3) {
          console.log(`Tracking view for RFP ${id} with duration ${duration}s`);
          
          const response = await fetch('/api/analytics/track-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              rfpId: Number(id),
              duration: duration,
            }),
            credentials: 'include', // Important: Include cookies for auth
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.skipped) {
            console.log('View tracking skipped (owner self-view)');
          } else {
            console.log('View tracking successful');
            // Invalidate analytics cache if this user generated new analytics
            // This ensures analytics on Dashboard are up-to-date
            try {
              const { queryClient } = await import('@/lib/queryClient');
              queryClient.invalidateQueries({ queryKey: ['/api/analytics/boosted'] });
            } catch (err) {
              console.error('Failed to invalidate analytics cache:', err);
            }
          }
          
          hasTrackedView.current = true;
        } else {
          console.log(`View duration too short: ${duration}s, not tracking`);
        }
      } catch (error) {
        console.error('Failed to track RFP view:', error);
      }
    };

    // Track view when page visibility changes (user switches tabs or minimizes window)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackViewDuration();
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up tracking to record after 10 seconds on page (even if they don't leave)
    const trackingTimer = setTimeout(() => {
      console.log("Performing scheduled view tracking after 10s of engagement");
      trackViewDuration();
    }, 10000);

    // Cleanup function to track view when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(trackingTimer);
      trackViewDuration();
    };
  }, [id, user, rfp]);

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

    // Save current theme state
    const root = window.document.documentElement;
    const wasDarkMode = root.classList.contains('dark');
    
    // Force light mode for PDF generation
    root.classList.remove('dark');
    root.classList.add('light');

    // Generate PDF and then restore original theme
    html2pdf().set(opt).from(element).save().then(() => {
      // Restore original theme
      if (wasDarkMode) {
        root.classList.remove('light');
        root.classList.add('dark');
      }
      
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
        <div className="mb-8">
          <BreadcrumbNav items={breadcrumbItems} />
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
          <div className="mb-6 relative">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-32"> {/* Add padding to prevent title from overlapping button */}
                <h1 className="text-3xl font-bold">{rfp.title}</h1>
                <p className="text-muted-foreground mt-2">
                  {rfp.organization?.companyName || "Unknown Organization"}
                </p>
              </div>
              <div id="download-button" className="absolute right-0 top-0">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download RFP
                </Button>
              </div>
            </div>
          </div>

          {/* Owner Controls */}
          {isOwner && (
            <>
              <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">RFP Management</h3>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit RFP
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete RFP
                  </Button>
                </div>
              </div>
            </>
          )}

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

        {/* Edit RFP Modal */}
        {isOwner && (
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit RFP</DialogTitle>
              </DialogHeader>
              <EditRfpForm
                rfp={rfp}
                onSuccess={() => setIsEditModalOpen(false)}
                onCancel={() => setIsEditModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Delete RFP Dialog */}
        {isOwner && (
          <DeleteRfpDialog
            rfp={rfp}
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          />
        )}
      </main>
    </div>
  );
}