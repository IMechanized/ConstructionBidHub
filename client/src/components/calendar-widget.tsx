import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isSameDay, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

export function CalendarWidget() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: rfps } = useQuery<Rfp[]>({
    queryKey: ["/api/rfps"],
  });

  // Get events for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const rfpsThisMonth = rfps?.filter(rfp => {
    const deadline = rfp.deadline ? new Date(rfp.deadline) : null;
    const walkthrough = rfp.walkthroughDate ? new Date(rfp.walkthroughDate) : null;
    const rfiDate = rfp.rfiDate ? new Date(rfp.rfiDate) : null;

    return (
      (deadline && isWithinInterval(deadline, { start: monthStart, end: monthEnd })) ||
      (walkthrough && isWithinInterval(walkthrough, { start: monthStart, end: monthEnd })) ||
      (rfiDate && isWithinInterval(rfiDate, { start: monthStart, end: monthEnd }))
    );
  }) || [];

  // Get events for selected date
  const eventsOnDate = selectedDate
    ? rfpsThisMonth.filter(rfp => {
        const deadline = rfp.deadline ? new Date(rfp.deadline) : null;
        const walkthrough = rfp.walkthroughDate ? new Date(rfp.walkthroughDate) : null;
        const rfiDate = rfp.rfiDate ? new Date(rfp.rfiDate) : null;

        return (
          (deadline && isSameDay(deadline, selectedDate)) ||
          (walkthrough && isSameDay(walkthrough, selectedDate)) ||
          (rfiDate && isSameDay(rfiDate, selectedDate))
        );
      })
    : [];

  // Get all dates with events
  const datesWithEvents = new Set<string>();
  rfpsThisMonth.forEach(rfp => {
    if (rfp.deadline) {
      datesWithEvents.add(format(new Date(rfp.deadline), "yyyy-MM-dd"));
    }
    if (rfp.walkthroughDate) {
      datesWithEvents.add(format(new Date(rfp.walkthroughDate), "yyyy-MM-dd"));
    }
    if (rfp.rfiDate) {
      datesWithEvents.add(format(new Date(rfp.rfiDate), "yyyy-MM-dd"));
    }
  });

  return (
    <div className="space-y-4" data-testid="calendar-widget">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        className="rounded-md border"
        modifiers={{
          hasEvent: (date) => datesWithEvents.has(format(date, "yyyy-MM-dd")),
        }}
        modifiersStyles={{
          hasEvent: {
            fontWeight: "bold",
            textDecoration: "underline",
          },
        }}
      />

      {selectedDate && eventsOnDate.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">
            Events on {format(selectedDate, "MMM d, yyyy")}
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {eventsOnDate.map(rfp => {
              const deadline = rfp.deadline ? new Date(rfp.deadline) : null;
              const walkthrough = rfp.walkthroughDate ? new Date(rfp.walkthroughDate) : null;
              const rfiDate = rfp.rfiDate ? new Date(rfp.rfiDate) : null;

              const events: Array<{ type: string; color: string }> = [];
              if (deadline && isSameDay(deadline, selectedDate)) {
                events.push({ type: "Deadline", color: "bg-red-500" });
              }
              if (walkthrough && isSameDay(walkthrough, selectedDate)) {
                events.push({ type: "Walkthrough", color: "bg-blue-500" });
              }
              if (rfiDate && isSameDay(rfiDate, selectedDate)) {
                events.push({ type: "RFI Due", color: "bg-green-500" });
              }

              return (
                <Link key={rfp.id} href={`/rfp/${encodeURIComponent(rfp.jobState)}/${rfp.slug || rfp.id}?from=dashboard`}>
                  <div className="p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{rfp.title}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {events.map((event, idx) => (
                            <Badge
                              key={idx}
                              className={`text-xs ${event.color} text-white`}
                            >
                              {event.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && eventsOnDate.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No events on this date
        </p>
      )}
    </div>
  );
}
