import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rfp } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  format,
} from "date-fns";
import { generateClientSlug } from "@/lib/utils";
import { ExternalLink, CalendarDays } from "lucide-react";

type CalendarEvent = {
  rfp: Rfp;
  type: "deadline" | "walkthrough" | "rfi";
  date: Date;
};

const EVENT_STYLES: Record<CalendarEvent["type"], { label: string; className: string }> = {
  deadline: {
    label: "Deadline",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  walkthrough: {
    label: "Walkthrough",
    className: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  },
  rfi: {
    label: "RFI Due",
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
};

export function CalendarWidget() {
  const { data: rfps } = useQuery<Rfp[]>({ queryKey: ["/api/rfps"] });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthInterval = {
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  };

  const monthEvents: CalendarEvent[] = [];
  rfps?.forEach(rfp => {
    const deadline = new Date(rfp.deadline);
    if (isWithinInterval(deadline, monthInterval)) {
      monthEvents.push({ rfp, type: "deadline", date: deadline });
    }
    if (rfp.walkthroughDate) {
      const walkthrough = new Date(rfp.walkthroughDate);
      if (isWithinInterval(walkthrough, monthInterval)) {
        monthEvents.push({ rfp, type: "walkthrough", date: walkthrough });
      }
    }
    if (rfp.rfiDate) {
      const rfiDate = new Date(rfp.rfiDate);
      if (isWithinInterval(rfiDate, monthInterval)) {
        monthEvents.push({ rfp, type: "rfi", date: rfiDate });
      }
    }
  });

  const eventDates = new Set(monthEvents.map(e => e.date.toDateString()));

  const selectedEvents = selectedDate
    ? monthEvents.filter(e => e.date.toDateString() === selectedDate.toDateString())
    : [];

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        className="rounded-md border border-border p-0"
        modifiers={{
          hasEvent: (date) => eventDates.has(date.toDateString()),
        }}
        modifiersClassNames={{
          hasEvent: "font-semibold underline decoration-primary underline-offset-2",
        }}
      />

      {selectedDate && (
        <div>
          <p className="text-[0.75rem] font-medium text-muted-foreground mb-2">
            {format(selectedDate, "MMMM d, yyyy")}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-[0.8125rem] text-muted-foreground">No events on this date.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedEvents.map((event, idx) => {
                const style = EVENT_STYLES[event.type];
                const state = encodeURIComponent(event.rfp.jobState);
                const clientSlug = encodeURIComponent(
                  generateClientSlug(event.rfp.clientName || (event.rfp as any).organization?.companyName)
                );
                const slug = event.rfp.slug || event.rfp.id;
                return (
                  <Link
                    key={idx}
                    href={`/rfp/${state}/${clientSlug}/${slug}?from=dashboard`}
                  >
                    <div className={`flex items-center gap-2.5 rounded-md border px-3 py-2 transition-colors duration-150 hover:brightness-95 ${style.className}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.8125rem] font-medium truncate">{event.rfp.title}</p>
                        <p className="text-[0.75rem] opacity-75">{style.label}</p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedDate && monthEvents.length === 0 && (
        <div className="flex flex-col items-center py-6 text-center">
          <CalendarDays className="h-8 w-8 text-border mb-2" />
          <p className="text-[0.8125rem] text-muted-foreground">
            No events this month.
          </p>
          <p className="text-[0.75rem] text-muted-foreground mt-1">
            Deadlines, walkthroughs, and RFI dates appear here.
          </p>
        </div>
      )}
    </div>
  );
}
