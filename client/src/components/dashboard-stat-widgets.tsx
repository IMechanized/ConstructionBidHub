import { useQuery } from "@tanstack/react-query";
import { Rfp, Rfi } from "@shared/schema";
import { Calendar, Clock, MessageSquare, TrendingUp, AlertCircle } from "lucide-react";
import { addDays, isAfter, isBefore, format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { generateClientSlug } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ─── Expiring Soon ──────────────────────────────────────────── */
export function RfpsExpiringSoonWidget() {
  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const sevenDaysFromNow = addDays(now, 7);

  const expiringRfps = rfps?.filter(rfp => {
    const deadline = new Date(rfp.deadline);
    return isAfter(deadline, now) && isBefore(deadline, sevenDaysFromNow);
  }) || [];

  return (
    <div className="space-y-3" data-testid="widget-expiring-soon">
      <div className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Closing this week
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight text-foreground">
          {expiringRfps.length}
        </span>
        <span className="text-[0.8125rem] text-muted-foreground">
          {expiringRfps.length === 1 ? "opportunity" : "opportunities"}
        </span>
      </div>

      {expiringRfps.length > 0 ? (
        <div className="space-y-1 max-h-44 overflow-y-auto">
          {expiringRfps.slice(0, 5).map(rfp => {
            const deadline = new Date(rfp.deadline);
            const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <Link
                key={rfp.id}
                href={`/rfp/${encodeURIComponent(rfp.jobState)}/${encodeURIComponent(generateClientSlug(rfp.clientName || (rfp as any).organization?.companyName))}/${rfp.slug || rfp.id}?from=dashboard`}
              >
                <div className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 hover:bg-accent transition-colors duration-150">
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] font-medium truncate">{rfp.title}</p>
                    <p className="text-[0.75rem] text-muted-foreground">{rfp.jobCity}, {rfp.jobState}</p>
                  </div>
                  <Badge
                    variant={daysUntil <= 3 ? "destructive" : "secondary"}
                    className="text-[0.6875rem] shrink-0"
                  >
                    {daysUntil}d
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-[0.8125rem] text-muted-foreground py-2">
          No deadlines this week — check back Monday.
        </p>
      )}

      <Link href="/opportunities/featured">
        <Button variant="outline" size="sm" className="w-full mt-1">
          Browse Opportunities
        </Button>
      </Link>
    </div>
  );
}

/* ─── Unread RFIs ───────────────────────────────────────────── */
export function UnreadRfisWidget() {
  const { data: rfis, isLoading } = useQuery<Rfi[]>({
    queryKey: ["/api/rfis"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const unreadCount = rfis?.filter(rfi => rfi.status === "pending").length || 0;

  return (
    <div className="space-y-3" data-testid="widget-unread-rfis">
      <div className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        Pending RFIs
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn(
          "text-3xl font-semibold tracking-tight",
          unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
        )}>
          {unreadCount}
        </span>
        <span className="text-[0.8125rem] text-muted-foreground">
          {unreadCount === 1 ? "inquiry" : "inquiries"} pending
        </span>
      </div>

      {unreadCount > 0 && (
        <p className="text-[0.8125rem] text-muted-foreground">
          {unreadCount} {unreadCount === 1 ? "buyer is" : "buyers are"} waiting for your response.
        </p>
      )}

      <Link href="/dashboard/rfis">
        <Button variant="outline" size="sm" className="w-full">
          {unreadCount > 0 ? `Respond to ${unreadCount} RFI${unreadCount > 1 ? "s" : ""}` : "Manage RFIs"}
        </Button>
      </Link>
    </div>
  );
}

/* ─── Response Rate ─────────────────────────────────────────── */
export function ResponseRateWidget() {
  const { data: rfis } = useQuery<Rfi[]>({
    queryKey: ["/api/rfis"],
  });

  const totalRfis = rfis?.length || 0;
  const respondedRfis = rfis?.filter(rfi => rfi.status === "responded").length || 0;
  const responseRate = totalRfis > 0 ? Math.round((respondedRfis / totalRfis) * 100) : 0;

  const rateColor =
    responseRate >= 80 ? "bg-chart-2" :
    responseRate >= 50 ? "bg-chart-4" :
    "bg-destructive";

  return (
    <div className="space-y-3" data-testid="widget-response-rate">
      <div className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" />
        Response rate
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight text-foreground">
          {responseRate}%
        </span>
        {totalRfis > 0 && (
          <span className="text-[0.8125rem] text-muted-foreground">
            {respondedRfis}/{totalRfis} answered
          </span>
        )}
      </div>

      {totalRfis > 0 ? (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-300", rateColor)}
              style={{ width: `${responseRate}%` }}
            />
          </div>
          <p className="text-[0.75rem] text-muted-foreground">
            {responseRate >= 80
              ? "Excellent — keep it up."
              : responseRate >= 50
              ? "Good — aim for 80%+ to stay competitive."
              : "Low — respond quickly to improve visibility."}
          </p>
        </div>
      ) : (
        <p className="text-[0.8125rem] text-muted-foreground">
          No RFIs yet. Rate appears once inquiries arrive.
        </p>
      )}
    </div>
  );
}

/* ─── Active RFPs ───────────────────────────────────────────── */
export function ActiveRfpsWidget() {
  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-16" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const activeRfps = rfps?.filter(rfp => {
    const deadline = new Date(rfp.deadline);
    return isAfter(deadline, now) && rfp.status === "open";
  }) || [];
  const featuredCount = activeRfps.filter(rfp => rfp.featured).length;

  return (
    <div className="space-y-3" data-testid="widget-active-rfps">
      <div className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        Open RFPs
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight text-foreground">
          {activeRfps.length}
        </span>
        <span className="text-[0.8125rem] text-muted-foreground">active now</span>
      </div>

      {activeRfps.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-[0.75rem] text-muted-foreground">Featured</p>
            <p className="text-lg font-semibold text-foreground">{featuredCount}</p>
          </div>
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-[0.75rem] text-muted-foreground">Regular</p>
            <p className="text-lg font-semibold text-foreground">{activeRfps.length - featuredCount}</p>
          </div>
        </div>
      ) : (
        <p className="text-[0.8125rem] text-muted-foreground">
          No open RFPs right now. New opportunities are posted daily.
        </p>
      )}

      <Link href="/dashboard/all">
        <Button variant="outline" size="sm" className="w-full">
          Search All RFPs
        </Button>
      </Link>
    </div>
  );
}

/* ─── Upcoming Deadlines ────────────────────────────────────── */
export function UpcomingDeadlinesWidget() {
  const { data: rfps, isLoading } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcomingRfps = rfps
    ?.filter(rfp => isAfter(new Date(rfp.deadline), now))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5) || [];

  return (
    <div className="space-y-3" data-testid="widget-upcoming-deadlines">
      <div className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5" />
        Upcoming deadlines
      </div>

      {upcomingRfps.length > 0 ? (
        <div className="space-y-1 max-h-52 overflow-y-auto">
          {upcomingRfps.map(rfp => {
            const deadline = new Date(rfp.deadline);
            const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <Link
                key={rfp.id}
                href={`/rfp/${encodeURIComponent(rfp.jobState)}/${encodeURIComponent(generateClientSlug(rfp.clientName || (rfp as any).organization?.companyName))}/${rfp.slug || rfp.id}?from=dashboard`}
              >
                <div className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 hover:bg-accent transition-colors duration-150">
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] font-medium truncate">{rfp.title}</p>
                    <p className="text-[0.75rem] text-muted-foreground">
                      {format(deadline, "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant={daysUntil <= 3 ? "destructive" : daysUntil <= 7 ? "secondary" : "outline"}
                    className="text-[0.6875rem] shrink-0"
                  >
                    {daysUntil}d
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-[0.8125rem] text-muted-foreground py-2">
          No upcoming deadlines. Browse open RFPs to find your next opportunity.
        </p>
      )}
    </div>
  );
}
