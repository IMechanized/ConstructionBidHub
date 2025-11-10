import { useQuery } from "@tanstack/react-query";
import { Rfp, Rfi } from "@shared/schema";
import { Calendar, Clock, MessageSquare, TrendingUp, AlertCircle } from "lucide-react";
import { addDays, isAfter, isBefore, format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function RfpsExpiringSoonWidget() {
  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const now = new Date();
  const sevenDaysFromNow = addDays(now, 7);
  
  const expiringRfps = rfps?.filter(rfp => {
    const deadline = new Date(rfp.deadline);
    return isAfter(deadline, now) && isBefore(deadline, sevenDaysFromNow);
  }) || [];

  return (
    <div className="space-y-3" data-testid="widget-expiring-soon">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-orange-500" />
        <span className="text-2xl font-bold">{expiringRfps.length}</span>
        <span className="text-sm text-muted-foreground">closing this week</span>
      </div>

      {expiringRfps.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {expiringRfps.slice(0, 5).map(rfp => {
            const deadline = new Date(rfp.deadline);
            const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <Link key={rfp.id} href={`/rfp/${rfp.id}`}>
                <div className="p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{rfp.title}</p>
                      <p className="text-xs text-muted-foreground">{rfp.jobCity}, {rfp.jobState}</p>
                    </div>
                    <Badge variant={daysUntil <= 3 ? "destructive" : "secondary"} className="text-xs">
                      {daysUntil}d
                    </Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No RFPs closing this week</p>
      )}

      <Link href="/opportunities/featured">
        <Button variant="outline" size="sm" className="w-full">
          View All Opportunities
        </Button>
      </Link>
    </div>
  );
}

export function UnreadRfisWidget() {
  const { data: rfis, isLoading } = useQuery<Rfi[]>({
    queryKey: ["/api/rfis"],
  });

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const unreadCount = rfis?.filter(rfi => rfi.status === "pending").length || 0;

  return (
    <div className="space-y-3" data-testid="widget-unread-rfis">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-blue-500" />
        <span className="text-2xl font-bold">{unreadCount}</span>
        <span className="text-sm text-muted-foreground">unread RFIs</span>
      </div>

      {unreadCount > 0 && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
          <p className="text-sm">
            You have {unreadCount} pending {unreadCount === 1 ? "inquiry" : "inquiries"} to respond to
          </p>
        </div>
      )}

      <Link href="/dashboard/rfis">
        <Button variant="outline" size="sm" className="w-full">
          Manage RFIs
        </Button>
      </Link>
    </div>
  );
}

export function ResponseRateWidget() {
  const { data: rfis } = useQuery<Rfi[]>({
    queryKey: ["/api/rfis"],
  });

  const totalRfis = rfis?.length || 0;
  const respondedRfis = rfis?.filter(rfi => rfi.status === "responded").length || 0;
  const responseRate = totalRfis > 0 ? Math.round((respondedRfis / totalRfis) * 100) : 0;

  return (
    <div className="space-y-3" data-testid="widget-response-rate">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-green-500" />
        <span className="text-2xl font-bold">{responseRate}%</span>
        <span className="text-sm text-muted-foreground">response rate</span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${responseRate}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {respondedRfis} of {totalRfis} inquiries responded to
      </p>
    </div>
  );
}

export function ActiveRfpsWidget() {
  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const now = new Date();
  const activeRfps = rfps?.filter(rfp => {
    const deadline = new Date(rfp.deadline);
    return isAfter(deadline, now) && rfp.status === "open";
  }) || [];

  const featuredCount = activeRfps.filter(rfp => rfp.featured).length;

  return (
    <div className="space-y-3" data-testid="widget-active-rfps">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-purple-500" />
        <span className="text-2xl font-bold">{activeRfps.length}</span>
        <span className="text-sm text-muted-foreground">active RFPs</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="p-2 rounded bg-accent">
          <p className="text-xs text-muted-foreground">Featured</p>
          <p className="font-semibold">{featuredCount}</p>
        </div>
        <div className="p-2 rounded bg-accent">
          <p className="text-xs text-muted-foreground">Regular</p>
          <p className="font-semibold">{activeRfps.length - featuredCount}</p>
        </div>
      </div>

      <Link href="/dashboard/all">
        <Button variant="outline" size="sm" className="w-full">
          View All RFPs
        </Button>
      </Link>
    </div>
  );
}

export function UpcomingDeadlinesWidget() {
  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const now = new Date();
  const upcomingRfps = rfps
    ?.filter(rfp => isAfter(new Date(rfp.deadline), now))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5) || [];

  return (
    <div className="space-y-3" data-testid="widget-upcoming-deadlines">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <span className="font-semibold">Upcoming Deadlines</span>
      </div>

      {upcomingRfps.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {upcomingRfps.map(rfp => {
            const deadline = new Date(rfp.deadline);
            const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <Link key={rfp.id} href={`/rfp/${rfp.id}`}>
                <div className="p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{rfp.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(deadline, "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant={daysUntil <= 3 ? "destructive" : daysUntil <= 7 ? "secondary" : "outline"} className="text-xs">
                      {daysUntil}d
                    </Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
      )}
    </div>
  );
}
