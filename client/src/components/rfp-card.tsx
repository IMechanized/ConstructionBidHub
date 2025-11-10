import { Rfp } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { MapPreview } from "@/components/map-preview";

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
}

export function RfpCard({ rfp, compact = false, isNew = false }: RfpCardProps) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.id === rfp.organizationId;

  return (
    <Card 
      className={`cursor-pointer transition-shadow hover:shadow-lg ${
        rfp.featured ? 'border-primary' : ''
      }`}
      onClick={() => setLocation(`/rfp/${rfp.id}`)}
    >
      <CardContent className={compact ? "p-3 sm:p-4" : "p-4 sm:p-6"}>
        {/* Organization Header */}
        <div className="flex flex-col items-center gap-2 mb-3 text-center">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
            {rfp.organization?.logo ? (
              <img
                src={rfp.organization.logo}
                alt={`${rfp.organization.companyName} logo`}
                className="object-cover"
              />
            ) : (
              <span className="text-base sm:text-lg">
                {rfp.organization?.companyName?.charAt(0)}
              </span>
            )}
          </Avatar>
          <span className="font-medium text-sm sm:text-base line-clamp-1">
            {rfp.organization?.companyName || "Unknown Organization"}
          </span>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {rfp.featured && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
            {isNew && !rfp.featured && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                New
              </span>
            )}
          </div>
        </div>

        <h3 className={`font-semibold ${compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} mb-2 line-clamp-2`}>
          {rfp.title}
        </h3>

        {!compact && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
            {stripHtml(rfp.description)}
          </p>
        )}

        <div className="space-y-2">
          {/* Location Map Preview */}
          <div className="w-full">
            <MapPreview
              address={`${rfp.jobStreet}, ${rfp.jobCity}, ${rfp.jobState} ${rfp.jobZip}`}
              className="w-full h-20 sm:h-24 rounded-md"
              onClick={() => {
                setLocation(`/rfp/${rfp.id}`);
              }}
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground">Location:</span>
              <span className="text-right truncate">{rfp.jobCity}, {rfp.jobState}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm gap-2">
              <span className="text-muted-foreground">Deadline:</span>
              <span>{format(new Date(rfp.deadline), 'MM/dd/yyyy')}</span>
            </div>
          </div>
        </div>

        {!compact && !isOwner && !currentUser && (
          <div className="mt-3">
            <Button variant="outline" size="sm" className="w-full h-9 text-sm" onClick={(e) => {
              e.stopPropagation();
              setLocation('/auth');
            }}>
              Login to Bid
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}