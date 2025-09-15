import { Rfp } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

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
      <CardContent className={compact ? "p-4" : "p-6"}>
        {/* Organization Header */}
        <div className="flex flex-col items-center gap-3 mb-4 text-center">
          <Avatar className="h-12 w-12">
            {rfp.organization?.logo ? (
              <img
                src={rfp.organization.logo}
                alt={`${rfp.organization.companyName} logo`}
                className="object-cover"
              />
            ) : (
              <span className="text-lg">
                {rfp.organization?.companyName?.charAt(0)}
              </span>
            )}
          </Avatar>
          <span className="font-medium">
            {rfp.organization?.companyName || "Unknown Organization"}
          </span>
          <div className="flex gap-2">
            {rfp.featured && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Featured
              </span>
            )}
            {isNew && !rfp.featured && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                New
              </span>
            )}
          </div>
        </div>

        <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'} mb-2`}>
          {rfp.title}
        </h3>

        {!compact && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {rfp.description}
          </p>
        )}

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">State:</span>
            <span>{rfp.jobState}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deadline:</span>
            <span>{format(new Date(rfp.deadline), 'MMM dd, yyyy')}</span>
          </div>
        </div>

        {!compact && !isOwner && !currentUser && (
          <div className="mt-4">
            <Button variant="outline" className="w-full" onClick={(e) => {
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