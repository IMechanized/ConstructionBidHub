import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Edit, Trash2, FileText, ExternalLink } from "lucide-react";
import { getCertificationClasses, normalizeUrl } from "@/lib/utils";
import { LocationMap } from "@/components/location-map";
import DOMPurify from 'dompurify';
import RfiForm from "@/components/bid-form";
import EditRfpForm from "@/components/edit-rfp-form";
import DeleteRfpDialog from "@/components/delete-rfp-dialog";
import type { Rfp, RfpDocument } from "@shared/schema";

interface RfpDetailContentProps {
  rfp: Rfp & {
    organization?: {
      id: number;
      companyName: string;
      logo?: string;
    } | null;
  };
  rfpDocuments: RfpDocument[];
  breadcrumbItems: Array<{ label: string; href: string }>;
  isOwner: boolean;
  user: any;
  isRfiModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteDialogOpen: boolean;
  setIsRfiModalOpen: (open: boolean) => void;
  setIsEditModalOpen: (open: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  handleDownload: () => void;
  onNavigateToAuth: () => void;
}

export function RfpDetailContent({
  rfp,
  rfpDocuments,
  breadcrumbItems,
  isOwner,
  user,
  isRfiModalOpen,
  isEditModalOpen,
  isDeleteDialogOpen,
  setIsRfiModalOpen,
  setIsEditModalOpen,
  setIsDeleteDialogOpen,
  handleDownload,
  onNavigateToAuth,
}: RfpDetailContentProps) {
  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="mb-4 sm:mb-8">
        <BreadcrumbNav items={breadcrumbItems} />
      </div>

      <div id="rfp-content" className="max-w-4xl mx-auto">
        {/* Important Dates Section */}
        <div className="mb-6 sm:mb-8 text-right text-xs sm:text-sm text-muted-foreground space-y-1">
          <div>Posted: {format(new Date(rfp.createdAt), "MM/dd/yyyy")}</div>
          <div>Walkthrough: {format(new Date(rfp.walkthroughDate), "MM/dd/yyyy")}</div>
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
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto"
                data-testid="rfp-portal-button"
              >
                <a
                  href={normalizeUrl(rfp.portfolioLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View RFP/Procurement Portal
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
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
              onClick={onNavigateToAuth}
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
              rfpId={rfp.id} 
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
    </>
  );
}
