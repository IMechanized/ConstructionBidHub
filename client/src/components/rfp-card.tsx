import { Rfp } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface RfpCardProps {
  rfp: Rfp;
  user?: {
    id: number;
    companyName: string;
    logo?: string;
  };
  compact?: boolean;
}

export function RfpCard({ rfp, user, compact = false }: RfpCardProps) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const isOwner = currentUser?.id === rfp.organizationId;

  const handleClick = () => {
    setLocation(`/rfp/${rfp.id}`);
  };

  return (
    <Card 
      className={`cursor-pointer transition-shadow hover:shadow-lg ${
        rfp.featured ? 'border-primary' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            {user?.logo ? (
              <img src={user.logo} alt={`${user.companyName} logo`} />
            ) : (
              <span className="text-xs">{user?.companyName?.charAt(0)}</span>
            )}
          </Avatar>
          <span className="text-sm font-medium">{user?.companyName}</span>
          {rfp.featured && (
            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Featured
            </span>
          )}
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
            <span className="text-muted-foreground">Location:</span>
            <span>{rfp.jobLocation}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deadline:</span>
            <span>{format(new Date(rfp.deadline), 'MMM dd, yyyy')}</span>
          </div>
        </div>

        {!compact && !isOwner && (
          <div className="mt-4">
            {currentUser ? (
              <Button className="w-full" onClick={(e) => {
                e.stopPropagation();
                setLocation(`/rfp/${rfp.id}`);
              }}>
                View Details & Bid
              </Button>
            ) : (
              <Button variant="outline" className="w-full" onClick={(e) => {
                e.stopPropagation();
                setLocation('/auth');
              }}>
                Login to Bid
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}