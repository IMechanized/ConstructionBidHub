import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Rfp, type RfpDocument } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, isAfter, subHours } from "date-fns";
import RfiForm from "@/components/bid-form";
import EditRfpForm from "@/components/edit-rfp-form";
import DeleteRfpDialog from "@/components/delete-rfp-dialog";
import { useState } from "react";
import { useLocation } from "wouter";
import { Avatar } from "@/components/ui/avatar";
import { Download, Edit, Trash2, FileText, Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Footer } from "@/components/ui/footer";
import { Link } from "wouter";
import html2pdf from 'html2pdf.js';
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { getCertificationClasses, normalizeUrl } from "@/lib/utils";
import { LocationMap } from "@/components/location-map";
import DOMPurify from 'dompurify';

export default function RfpPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, setLocationHook] = useLocation();
  const [isRfiModalOpen, setIsRfiModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  // Fetch RFP documents
  const { data: rfpDocuments = [] } = useQuery<RfpDocument[]>({
    queryKey: [`/api/rfps/${id}/documents`],
    enabled: !!id,
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
  
  // Determine if this RFP is "new" (posted in the last 24 hours)
  const twentyFourHoursAgo = subHours(new Date(), 24);
  const isNewRfp = isAfter(new Date(rfp.createdAt), twentyFourHoursAgo);
  
  // Determine if RFP should show on landing page (featured or new)
  const isLandingPageRfp = rfp.featured || isNewRfp;
  
  // Determine if we should show public layout (header) vs dashboard layout (sidebar)
  // Show public layout when:
  // 1. User is not logged in, OR
  // 2. RFP is featured or new (appears on landing page)
  const shouldShowPublicLayout = !user || isLandingPageRfp;
  
  // For public layout, determine contextual breadcrumb based on RFP properties
  const getPublicBreadcrumb = () => {
    if (rfp.featured) {
      return {
        label: "Featured Opportunities",
        href: "/opportunities/featured",
      };
    }
    
    if (isNewRfp) {
      return {
        label: "New Opportunities", 
        href: "/opportunities/new",
      };
    }
    
    // Fallback to Featured for older RFPs (shouldn't normally happen)
    return {
      label: "Featured Opportunities",
      href: "/opportunities/featured",
    };
  };
  
  // Breadcrumbs: Show dashboard breadcrumbs only when showing dashboard layout
  const breadcrumbItems = shouldShowPublicLayout
    ? [
        getPublicBreadcrumb(),
        {
          label: rfp.title || "RFP Details",
          href: `/rfp/${id}`,
        },
      ]
    : [
        {
          label: "Dashboard",
          href: "/dashboard",
        },
        {
          label: isOwner ? "My RFPs" : "Search All RFPs",
          href: isOwner ? "/dashboard/my-rfps" : "/dashboard/all",
        },
        {
          label: rfp.title || "RFP Details",
          href: `/rfp/${id}`,
        },
      ];

  return (
    <div className="min-h-screen bg-background">
      {!shouldShowPublicLayout ? (
        <DashboardSidebar />
      ) : (
        <nav className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Logo className="h-12 md:h-16" />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Support
              </Link>
              <ThemeToggle size="sm" />
              {user ? (
                <Button asChild size="sm" className="text-base">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm" className="text-base">
                  <Link href="/auth">Get Started</Link>
                </Button>
              )}
            </div>

            {/* Mobile Navigation - Hamburger Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col h-full pt-6">
                    <div className="space-y-4 flex-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-base"
                        asChild
                      >
                        <Link href="/support">Support</Link>
                      </Button>
                      
                      <div className="flex items-center justify-between px-3">
                        <span className="text-sm font-medium">Theme</span>
                        <ThemeToggle size="sm" />
                      </div>
                      
                      {user ? (
                        <Button
                          className="w-full text-base"
                          asChild
                        >
                          <Link href="/dashboard">Dashboard</Link>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full text-base"
                          asChild
                        >
                          <Link href="/auth">Get Started</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      )}

      <main className={!shouldShowPublicLayout ? "md:ml-[280px] mt-14 md:mt-0 container mx-auto px-3 sm:px-4 py-4 sm:py-8" : "container mx-auto px-3 sm:px-4 py-4 sm:py-8"}>
        <div className="mb-4 sm:mb-8">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        <div id="rfp-content" className="max-w-4xl mx-auto">
          {/* Important Dates Section */}
          <div className="mb-6 sm:mb-8 text-right text-xs sm:text-sm text-muted-foreground space-y-1">
            <div>Posted: {format(new Date(rfp.createdAt), "MM/dd/yyyy")}</div>
            <div>RFI Due: {format(new Date(rfp.rfiDate), "MM/dd/yyyy")}</div>
            <div>Deadline: {format(new Date(rfp.deadline), "MM/dd/yyyy")}</div>
          </div>

          <hr className="my-4 sm:my-6 border-muted" />

          {/* Title and Organization Section */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{rfp.title}</h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  {rfp.organization?.companyName || "Unknown Organization"}
                </p>
              </div>
              <div id="download-button" className="shrink-0">
                <Button variant="outline" size="sm" onClick={handleDownload} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download RFP
                </Button>
              </div>
            </div>
          </div>

          <hr className="my-4 sm:my-6 border-muted" />

          {/* Project Overview */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Project Overview</h2>
            <div 
              className="prose prose-sm max-w-none dark:prose-invert text-justify leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rfp.description) }}
            />
          </div>

          <hr className="my-4 sm:my-6 border-muted" />

          {/* Project Details */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Project Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              <div>
                <h3 className="font-medium mb-2">Street Address</h3>
                <p>{rfp.jobStreet}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">City</h3>
                <p>{rfp.jobCity}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">State</h3>
                <p>{rfp.jobState}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">ZIP Code</h3>
                <p>{rfp.jobZip}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Budget</h3>
                <p>
                  {rfp.budgetMin
                    ? `$${rfp.budgetMin.toLocaleString()}`
                    : "Not specified"}
                </p>
              </div>
              {rfp.mandatoryWalkthrough && (
                <div>
                  <h3 className="font-medium mb-2">Mandatory Walkthrough</h3>
                  <p>Yes</p>
                </div>
              )}
            </div>
          </div>

          <hr className="my-6 border-muted" />

          {/* Project Location Map */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Project Location</h2>
            <div className="rounded-lg overflow-hidden border">
              <LocationMap
                address={`${rfp.jobStreet}, ${rfp.jobCity}, ${rfp.jobState} ${rfp.jobZip}`}
                className="w-full h-48 sm:h-64 md:h-80"
                zoom={15}
                showMarker={true}
              />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              {rfp.jobStreet}, {rfp.jobCity}, {rfp.jobState} {rfp.jobZip}
            </p>
          </div>

          <hr className="my-4 sm:my-6 border-muted" />

          {/* Schedule */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Project Schedule</h2>
            <div className="space-y-2 text-sm sm:text-base">
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="font-medium">Site Walkthrough:</span>
                <span>{format(new Date(rfp.walkthroughDate), "MM/dd/yyyy 'at' h:mm a")}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="font-medium">RFI Submission Deadline:</span>
                <span>{format(new Date(rfp.rfiDate), "MM/dd/yyyy 'at' h:mm a")}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="font-medium">Proposal Due Date:</span>
                <span>{format(new Date(rfp.deadline), "MM/dd/yyyy 'at' h:mm a")}</span>
              </div>
            </div>
          </div>

          {rfp.certificationGoals && rfp.certificationGoals.length > 0 && (
            <>
              <hr className="my-4 sm:my-6 border-muted" />
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Certification Requirements</h2>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {rfp.certificationGoals.map((cert, index) => (
                    <Badge key={index} className={getCertificationClasses(cert)}>
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {rfp.desiredTrades && rfp.desiredTrades.length > 0 && (
            <>
              <hr className="my-6 border-muted" />
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Desired Trades</h2>
                <div className="flex flex-wrap gap-2">
                  {rfp.desiredTrades.map((trade, index) => (
                    <Badge key={index} className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/50">
                      {trade}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {rfp.portfolioLink && (
            <>
              <hr className="my-6 border-muted" />
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Additional Resources</h2>
                <a
                  href={normalizeUrl(rfp.portfolioLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View RFP/Procurement Portal
                </a>
              </div>
            </>
          )}
        </div>

        {/* RFP Documents - Outside PDF content */}
        {rfpDocuments.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8 p-4 bg-muted/50 rounded-lg border">
            <h3 className="text-lg font-semibold mb-3">RFP Documents</h3>
            <div className="space-y-2">
              {rfpDocuments.map((doc) => (
                <a
                  key={doc.id}
                  href={`/api/rfp-documents/${doc.id}/download`}
                  className="flex items-center gap-3 p-3 bg-background hover:bg-muted rounded-lg transition-colors group"
                  data-testid={`document-${doc.id}`}
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary">
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{doc.documentType}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.uploadedAt), "MMM dd, yyyy")}</span>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Owner Controls - Outside PDF content */}
        {isOwner && (
          <div className="max-w-4xl mx-auto mt-8 p-4 bg-muted/50 rounded-lg border">
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
        )}

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
                onClick={() => setLocationHook("/auth")}
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

      <Footer />
    </div>
  );
}