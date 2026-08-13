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
import { Download, Edit, Trash2, FileText, ExternalLink, MapPin, Calendar, Clock, Hash } from "lucide-react";
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
  const deadline = new Date(rfp.deadline);
  const now = new Date();
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntil >= 0 && daysUntil <= 3;

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-6">
        <BreadcrumbNav items={breadcrumbItems} />
      </div>

      {/* ── Metadata sidebar + Title ───────────────────────────── */}
      <div id="rfp-content" className="max-w-4xl mx-auto">

        {/* Header: title + download */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <p className="text-[0.8125rem] font-medium text-muted-foreground mb-1" data-testid="rfp-detail-client-name">
              {rfp.clientName || rfp.organization?.companyName || "Unknown Organization"}
            </p>
            {rfp.clientName && rfp.clientName !== rfp.organization?.companyName && (
              <p className="text-[0.75rem] text-muted-foreground mb-1">
                Posted by {rfp.organization?.companyName}
              </p>
            )}
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground leading-tight">
              {rfp.title}
            </h1>
          </div>
          <div id="download-button" className="shrink-0">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Download RFP
            </Button>
          </div>
        </div>

        {/* Key metadata strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-lg bg-muted/50 border border-border">
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground mb-1">Posted</p>
            <p className="text-[0.8125rem] font-medium">{format(new Date(rfp.createdAt), "MMM d, yyyy")}</p>
          </div>
          {rfp.walkthroughDate && (
            <div>
              <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground mb-1">Walkthrough</p>
              <p className="text-[0.8125rem] font-medium">
                {format(new Date(rfp.walkthroughDate), "MMM d, yyyy")}
                {rfp.mandatoryWalkthrough && (
                  <span className="ml-1 text-[0.6875rem] text-chart-4">(Required)</span>
                )}
              </p>
            </div>
          )}
          {rfp.rfiDate && (
            <div>
              <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground mb-1">RFI Due</p>
              <p className="text-[0.8125rem] font-medium">{format(new Date(rfp.rfiDate), "MMM d, yyyy")}</p>
            </div>
          )}
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground mb-1">Deadline</p>
            <p className={`text-[0.8125rem] font-semibold ${isUrgent ? "text-destructive" : "text-foreground"}`}>
              {format(deadline, "MMM d, yyyy")}
              {daysUntil >= 0 && daysUntil <= 7 && (
                <span className="ml-1 text-[0.6875rem] font-medium opacity-70">
                  ({daysUntil === 0 ? "today" : `${daysUntil}d`})
                </span>
              )}
            </p>
          </div>
        </div>

        <hr className="border-border mb-6" />

        {/* Project Overview */}
        <div className="mb-8">
          <h2 className="text-[1.0625rem] font-semibold mb-4">Project Overview</h2>
          <div
            className="prose prose-sm dark:prose-invert max-w-[72ch] leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rfp.description) }}
          />
        </div>

        <hr className="border-border mb-6" />

        {/* Project Details */}
        <div className="mb-8">
          <h2 className="text-[1.0625rem] font-semibold mb-4">Project Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <dl className="space-y-3">
              <div>
                <dt className="text-[0.75rem] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Street Address</dt>
                <dd className="text-[0.9375rem]">{rfp.jobStreet}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">City</dt>
                <dd className="text-[0.9375rem]">{rfp.jobCity}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">State</dt>
                <dd className="text-[0.9375rem]">{rfp.jobState}</dd>
              </div>
            </dl>
            <dl className="space-y-3">
              <div>
                <dt className="text-[0.75rem] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">ZIP Code</dt>
                <dd className="text-[0.9375rem]">{rfp.jobZip}</dd>
              </div>
              {rfp.budgetMin != null && (
                <div>
                  <dt className="text-[0.75rem] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Budget</dt>
                  <dd className="text-[0.9375rem] font-semibold">${rfp.budgetMin.toLocaleString()}</dd>
                </div>
              )}
              {rfp.mandatoryWalkthrough && (
                <div>
                  <dt className="text-[0.75rem] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Site Walkthrough</dt>
                  <dd className="text-[0.9375rem] font-medium text-chart-4">Required</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <hr className="border-border mb-6" />

        {/* Location Map */}
        <div className="mb-8">
          <h2 className="text-[1.0625rem] font-semibold mb-4">Project Location</h2>
          <div className="rounded-lg overflow-hidden border border-border">
            <LocationMap
              address={`${rfp.jobStreet}, ${rfp.jobCity}, ${rfp.jobState} ${rfp.jobZip}`}
              className="w-full h-48 sm:h-64 md:h-80"
              zoom={15}
              showMarker={true}
            />
          </div>
          <p className="text-[0.8125rem] text-muted-foreground mt-2 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {rfp.jobStreet}, {rfp.jobCity}, {rfp.jobState} {rfp.jobZip}
          </p>
        </div>

        <hr className="border-border mb-6" />

        {/* Schedule */}
        <div className="mb-8">
          <h2 className="text-[1.0625rem] font-semibold mb-4">Project Schedule</h2>
          <div className="space-y-3">
            {rfp.walkthroughDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[0.8125rem] font-medium">Site Walkthrough</p>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    {format(new Date(rfp.walkthroughDate), "MMMM d, yyyy 'at' h:mm a")}
                    {rfp.mandatoryWalkthrough && (
                      <span className="ml-2 text-[0.75rem] font-medium text-chart-4">Mandatory</span>
                    )}
                  </p>
                </div>
              </div>
            )}
            {rfp.rfiDate && (
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[0.8125rem] font-medium">RFI Submission Deadline</p>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    {format(new Date(rfp.rfiDate), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[0.8125rem] font-medium">Proposal Due Date</p>
                <p className={`text-[0.8125rem] ${isUrgent ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {format(deadline, "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {rfp.certificationGoals && rfp.certificationGoals.length > 0 && (
          <>
            <hr className="border-border mb-6" />
            <div className="mb-8">
              <h2 className="text-[1.0625rem] font-semibold mb-4">Certification Requirements</h2>
              <div className="flex flex-wrap gap-2">
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
            <hr className="border-border mb-6" />
            <div className="mb-8">
              <h2 className="text-[1.0625rem] font-semibold mb-4">Desired Trades</h2>
              <div className="flex flex-wrap gap-2">
                {rfp.desiredTrades.map((trade, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-[0.8125rem]"
                  >
                    {trade}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {rfp.portfolioLink && (
          <>
            <hr className="border-border mb-6" />
            <div className="mb-8">
              <h2 className="text-[1.0625rem] font-semibold mb-4">Additional Resources</h2>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1.5"
                data-testid="rfp-portal-button"
              >
                <a
                  href={normalizeUrl(rfp.portfolioLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View RFP/Procurement Portal
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </>
        )}
      </div>

      {/* RFP Documents */}
      {rfpDocuments.length > 0 && (
        <div className="max-w-4xl mx-auto mt-8">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="text-[0.9375rem] font-semibold mb-3">RFP Documents</h3>
            <div className="space-y-1.5">
              {rfpDocuments.map((doc) => (
                <a
                  key={doc.id}
                  href={`/api/rfp-documents/${doc.id}/download`}
                  className="group flex items-center gap-3 rounded-md p-3 bg-background hover:bg-accent transition-colors duration-150"
                  data-testid={`document-${doc.id}`}
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] font-medium truncate group-hover:text-primary transition-colors">
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground">
                      <span className="capitalize">{doc.documentType}</span>
                      <span>·</span>
                      <span>{format(new Date(doc.uploadedAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Owner Controls */}
      {isOwner && (
        <div className="max-w-4xl mx-auto mt-6">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-[0.75rem] font-medium text-muted-foreground uppercase tracking-wider mb-3">RFP Management</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit RFP
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete RFP
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bid CTA */}
      {!isOwner && (
        <div id="bid-button" className="max-w-4xl mx-auto mt-10">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
            <h3 className="text-[1.0625rem] font-semibold mb-1">Ready to Bid?</h3>
            <p className="text-[0.8125rem] text-muted-foreground mb-4">
              Deadline: {format(deadline, "MMMM d, yyyy")}
              {daysUntil >= 0 && (
                <span className={`ml-1.5 font-medium ${isUrgent ? "text-destructive" : "text-chart-4"}`}>
                  ({daysUntil === 0 ? "due today" : `${daysUntil} days left`})
                </span>
              )}
            </p>
            {user ? (
              <Button size="lg" onClick={() => setIsRfiModalOpen(true)} className="px-8">
                Submit Bid Request
              </Button>
            ) : (
              <div className="space-y-2">
                <Button size="lg" onClick={onNavigateToAuth} className="px-8">
                  Log in to Submit Bid
                </Button>
                <p className="text-[0.75rem] text-muted-foreground">Free to join. No subscription required.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RFI Modal */}
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

      {/* Delete Dialog */}
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
