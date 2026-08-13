import { Rfp } from "@shared/schema";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { MapPreview } from "@/components/map-preview";
import { generateClientSlug } from "@/lib/utils";
import { MapPin, Calendar, Wrench, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

interface RfpCardProps {
  rfp: Rfp & {
    organization?: {
      id: number;
      companyName: string;
      logo?: string;
    } | null;
  };
  compact?: boolean;
  isNew?: boolean;
  from?: string;
}

export function RfpCard({ rfp, compact = false, isNew = false, from }: RfpCardProps) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.id === rfp.organizationId;

  const handleNavigation = () => {
    const state = encodeURIComponent(rfp.jobState);
    const clientSlug = encodeURIComponent(generateClientSlug(rfp.clientName || rfp.organization?.companyName));
    const slug = rfp.slug || rfp.id.toString();
    const url = from ? `/rfp/${state}/${clientSlug}/${slug}?from=${from}` : `/rfp/${state}/${clientSlug}/${slug}`;
    setLocation(url);
  };

  const clientName = rfp.clientName || rfp.organization?.companyName || "Unknown Organization";
  const deadline = new Date(rfp.deadline);
  const now = new Date();
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntil >= 0 && daysUntil <= 3;
  const isClosingSoon = daysUntil >= 0 && daysUntil <= 7;

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-lg border border-border bg-card transition-shadow duration-150 cursor-pointer hover:shadow-md",
        rfp.featured && "ring-1 ring-primary/30"
      )}
      onClick={handleNavigation}
      aria-label={`${rfp.title} — ${clientName}`}
    >
      {/* Badges row */}
      {(rfp.featured || isNew) && (
        <div className="flex gap-1.5 px-4 pt-3 pb-0">
          {rfp.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.6875rem] font-medium text-primary">
              <Star className="h-3 w-3" />
              Featured
            </span>
          )}
          {isNew && !rfp.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[0.6875rem] font-medium text-accent-foreground">
              <Sparkles className="h-3 w-3" />
              New
            </span>
          )}
        </div>
      )}

      <div className={compact ? "p-3 sm:p-4" : "p-4"}>
        {/* Client name */}
        <p className="text-[0.8125rem] font-medium text-muted-foreground mb-1 truncate" data-testid="rfp-client-name">
          {clientName}
        </p>

        {/* Title */}
        <h3 className={cn(
          "font-semibold text-foreground leading-snug mb-3",
          compact ? "text-[0.9375rem] line-clamp-2" : "text-[1.0625rem] line-clamp-2"
        )}>
          {rfp.title}
        </h3>

        {/* Description (non-compact only) */}
        {!compact && (
          <p className="text-[0.8125rem] text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
            {stripHtml(rfp.description)}
          </p>
        )}

        {/* Map preview */}
        <div className="mb-3 rounded-md overflow-hidden">
          <MapPreview
            address={`${rfp.jobStreet}, ${rfp.jobCity}, ${rfp.jobState} ${rfp.jobZip}`}
            className="w-full h-20 sm:h-24"
            onClick={handleNavigation}
          />
        </div>

        {/* Metadata rows */}
        <dl className="space-y-1.5">
          <div className="flex items-center gap-2 text-[0.8125rem]">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground shrink-0">Location</span>
            <span className="ml-auto text-foreground truncate">{rfp.jobCity}, {rfp.jobState}</span>
          </div>

          {rfp.walkthroughDate && (
            <div className="flex items-center gap-2 text-[0.8125rem]">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground shrink-0">Walkthrough</span>
              <span className="ml-auto text-foreground">
                {format(new Date(rfp.walkthroughDate), 'MM/dd/yyyy')}
                {rfp.mandatoryWalkthrough && (
                  <span className="ml-1 text-[0.6875rem] text-chart-4 font-medium">(Required)</span>
                )}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[0.8125rem]">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground shrink-0">Deadline</span>
            <span className={cn(
              "ml-auto font-medium",
              isUrgent ? "text-destructive" : isClosingSoon ? "text-chart-4" : "text-foreground"
            )}>
              {format(deadline, 'MM/dd/yyyy')}
              {isClosingSoon && daysUntil >= 0 && (
                <span className="ml-1.5 text-[0.6875rem] font-medium opacity-80">
                  {daysUntil === 0 ? "Today" : `${daysUntil}d`}
                </span>
              )}
            </span>
          </div>

          {rfp.desiredTrades && rfp.desiredTrades.length > 0 && (
            <div className="flex items-start gap-2 text-[0.8125rem]">
              <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground shrink-0">Trades</span>
              <span className="ml-auto text-foreground text-right truncate">
                {rfp.desiredTrades.join(', ')}
              </span>
            </div>
          )}
        </dl>

        {/* Login to Bid CTA */}
        {!compact && !isOwner && !currentUser && (
          <div className="mt-4 pt-3 border-t border-border">
            <Button
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                setLocation('/auth');
              }}
            >
              Login to Bid
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
