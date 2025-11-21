import { useEffect, useRef, useMemo } from "react";
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
import { Download, Edit, Trash2, FileText } from "lucide-react";
import { Footer } from "@/components/ui/footer";
import { Link } from "wouter";
import html2pdf from 'html2pdf.js';
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { getCertificationClasses, normalizeUrl } from "@/lib/utils";
import { LocationMap } from "@/components/location-map";
import DOMPurify from 'dompurify';
import { LandingPageHeader } from "@/components/landing-page-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { RfpDetailContent } from "@/components/rfp-detail-content";

export default function RfpPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isRfiModalOpen, setIsRfiModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const viewStartTime = useRef<number>(Date.now());
  const hasTrackedView = useRef<boolean>(false);
  
  // Read navigation context from URL query parameter
  const navContext = useMemo(() => {
    const searchMatch = location.match(/\?(.+)/);
    const search = searchMatch?.[1] ?? '';
    const params = new URLSearchParams(search);
    const fromParam = params.get('from');
    
    // Validate against allowed sources
    const allowedSources = ['featured', 'new', 'my-rfps', 'all-rfps', 'dashboard-featured', 'dashboard-new'];
    if (fromParam && allowedSources.includes(fromParam)) {
      return { from: fromParam };
    }
    
    return null;
  }, [location]);

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
  
  // Determine breadcrumbs and back button based on navigation context
  const getBreadcrumbsAndBackButton = () => {
    // If we have navigation context, use it
    if (navContext) {
      if (navContext.from === 'my-rfps') {
        return {
          breadcrumbs: [
            { label: "Dashboard", href: "/dashboard" },
            { label: "My RFPs", href: "/dashboard/my-rfps" },
            { label: rfp.title || "RFP Details", href: `/rfp/${id}` },
          ],
          backButton: { label: "← Back to My RFPs", href: "/dashboard/my-rfps" },
        };
      }
      if (navContext.from === 'all-rfps') {
        return {
          breadcrumbs: [
            { label: "Dashboard", href: "/dashboard" },
            { label: "Search All RFPs", href: "/dashboard/all" },
            { label: rfp.title || "RFP Details", href: `/rfp/${id}` },
          ],
          backButton: { label: "← Back to Search All RFPs", href: "/dashboard/all" },
        };
      }
      if (navContext.from === 'dashboard-featured') {
        return {
          breadcrumbs: [
            { label: "Dashboard", href: "/dashboard" },
            { label: "Featured", href: "/dashboard/featured" },
            { label: rfp.title || "RFP Details", href: `/rfp/${id}` },
          ],
          backButton: { label: "← Back to Featured", href: "/dashboard/featured" },
        };
      }
      if (navContext.from === 'dashboard-new') {
        return {
          breadcrumbs: [
            { label: "Dashboard", href: "/dashboard" },
            { label: "New", href: "/dashboard/new" },
            { label: rfp.title || "RFP Details", href: `/rfp/${id}` },
          ],
          backButton: { label: "← Back to New", href: "/dashboard/new" },
        };
      }
      if (navContext.from === 'featured') {
        return {
          breadcrumbs: [
            { label: "Featured Opportunities", href: "/opportunities/featured" },
            { label: rfp.title || "RFP Details", href: `/rfp/${id}` },
          ],
          backButton: { label: "← Back to Featured Opportunities", href: "/opportunities/featured" },
        };
      }
      if (navContext.from === 'new') {
        return {
          breadcrumbs: [
            { label: "New Opportunities", href: "/opportunities/new" },
            { label: rfp.title || "RFP Details", href: `/rfp/${id}` },
          ],
          backButton: { label: "← Back to New Opportunities", href: "/opportunities/new" },
        };
      }
    }
    
    // Fallback: If no context and user is logged in, use role-based defaults
    if (user) {
      if (isOwner) {
        return {
          breadcrumbs: [
            { label: "Dashboard", href: "/dashboard" },
            { label: "My RFPs", href: "/dashboard/my-rfps" },
            { label: rfp.title || "RFP Details", href: `/rfp/${id}` },
          ],
          backButton: { label: "← Back to My RFPs", href: "/dashboard/my-rfps" },
        };
      } else {
        return {
          breadcrumbs: [
            { label: "Dashboard", href: "/dashboard" },
            { label: "Search All RFPs", href: "/dashboard/all" },
            { label: rfp.title || "RFP Details", href: `/rfp/${id}` },
          ],
          backButton: { label: "← Back to Search All RFPs", href: "/dashboard/all" },
        };
      }
    }
    
    // Fallback: For non-authenticated users, infer from RFP properties
    const twentyFourHoursAgo = subHours(new Date(), 24);
    const isNewRfp = isAfter(new Date(rfp.createdAt), twentyFourHoursAgo);
    
    if (rfp.featured) {
      return {
        breadcrumbs: [
          { label: "Featured Opportunities", href: "/opportunities/featured" },
          { label: rfp.title || "RFP Details", href: `/rfp/${id}` },
        ],
        backButton: { label: "← Back to Featured Opportunities", href: "/opportunities/featured" },
      };
    }
    
    if (isNewRfp) {
      return {
        breadcrumbs: [
          { label: "New Opportunities", href: "/opportunities/new" },
          { label: rfp.title || "RFP Details", href: `/rfp/${id}` },
        ],
        backButton: { label: "← Back to New Opportunities", href: "/opportunities/new" },
      };
    }
    
    // Final fallback: Home
    return {
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: rfp.title || "RFP Details", href: `/rfp/${id}` },
      ],
      backButton: { label: "← Back to Home", href: "/" },
    };
  };
  
  const { breadcrumbs } = getBreadcrumbsAndBackButton();
  const breadcrumbItems = breadcrumbs;

  // Determine layout based on navigation context
  const isDashboardView = navContext && ['dashboard-featured', 'dashboard-new', 'all-rfps', 'my-rfps'].includes(navContext.from);
  const isLandingPageView = navContext && ['featured', 'new'].includes(navContext.from);

  // Render with dashboard sidebar layout
  if (isDashboardView) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar currentPath={location} />
        <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <RfpDetailContent
            rfp={rfp}
            rfpDocuments={rfpDocuments}
            breadcrumbItems={breadcrumbItems}
            isOwner={isOwner}
            user={user}
            isRfiModalOpen={isRfiModalOpen}
            isEditModalOpen={isEditModalOpen}
            isDeleteDialogOpen={isDeleteDialogOpen}
            setIsRfiModalOpen={setIsRfiModalOpen}
            setIsEditModalOpen={setIsEditModalOpen}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            handleDownload={handleDownload}
            onNavigateToAuth={() => setLocation("/auth")}
          />
        </main>
      </div>
    );
  }

  // Render with landing page header and footer
  if (isLandingPageView) {
    return (
      <div className="min-h-screen bg-background">
        <LandingPageHeader />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <RfpDetailContent
            rfp={rfp}
            rfpDocuments={rfpDocuments}
            breadcrumbItems={breadcrumbItems}
            isOwner={isOwner}
            user={user}
            isRfiModalOpen={isRfiModalOpen}
            isEditModalOpen={isEditModalOpen}
            isDeleteDialogOpen={isDeleteDialogOpen}
            setIsRfiModalOpen={setIsRfiModalOpen}
            setIsEditModalOpen={setIsEditModalOpen}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            handleDownload={handleDownload}
            onNavigateToAuth={() => setLocation("/auth")}
          />
        </main>

        <Footer />
      </div>
    );
  }

  // Default layout (fallback - breadcrumb + footer, no header/sidebar)
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <RfpDetailContent
          rfp={rfp}
          rfpDocuments={rfpDocuments}
          breadcrumbItems={breadcrumbItems}
          isOwner={isOwner}
          user={user}
          isRfiModalOpen={isRfiModalOpen}
          isEditModalOpen={isEditModalOpen}
          isDeleteDialogOpen={isDeleteDialogOpen}
          setIsRfiModalOpen={setIsRfiModalOpen}
          setIsEditModalOpen={setIsEditModalOpen}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          handleDownload={handleDownload}
          onNavigateToAuth={() => setLocation("/auth")}
        />
      </main>

      <Footer />
    </div>
  );
}
