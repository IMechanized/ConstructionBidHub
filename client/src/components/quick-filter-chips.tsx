import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, MapPin, Calendar } from "lucide-react";
import { addDays, addMonths } from "date-fns";

export interface QuickFilter {
  id: string;
  label: string;
  icon: typeof Clock;
  description: string;
  filterFn: (rfp: any) => boolean;
}

interface QuickFilterChipsProps {
  activeFilter: string | null;
  onFilterChange: (filterId: string | null) => void;
}

export const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "closing-soon",
    label: "Closing This Week",
    icon: Clock,
    description: "RFPs with deadlines in the next 7 days",
    filterFn: (rfp) => {
      const deadline = new Date(rfp.deadline);
      const now = new Date();
      const weekFromNow = addDays(now, 7);
      return deadline >= now && deadline <= weekFromNow;
    },
  },
  {
    id: "featured",
    label: "Featured",
    icon: TrendingUp,
    description: "Premium featured opportunities",
    filterFn: (rfp) => rfp.featured === true,
  },
  {
    id: "high-value",
    label: "High Value",
    icon: TrendingUp,
    description: "Projects over $500k",
    filterFn: (rfp) => (rfp.budgetMin || 0) >= 500000,
  },
  {
    id: "near-deadline",
    label: "Deadline < 3 Days",
    icon: Calendar,
    description: "Urgent: Closing in 3 days or less",
    filterFn: (rfp) => {
      const deadline = new Date(rfp.deadline);
      const now = new Date();
      const threeDaysFromNow = addDays(now, 3);
      return deadline >= now && deadline <= threeDaysFromNow;
    },
  },
  {
    id: "next-month",
    label: "Next 30 Days",
    icon: Calendar,
    description: "RFPs closing within 30 days",
    filterFn: (rfp) => {
      const deadline = new Date(rfp.deadline);
      const now = new Date();
      const monthFromNow = addDays(now, 30);
      return deadline >= now && deadline <= monthFromNow;
    },
  },
];

export function QuickFilterChips({ activeFilter, onFilterChange }: QuickFilterChipsProps) {
  return (
    <div className="flex gap-2 flex-wrap" data-testid="quick-filter-chips">
      {QUICK_FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;

        return (
          <Badge
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            className={`cursor-pointer px-3 py-1.5 transition-all hover:scale-105 ${
              isActive ? "ring-2 ring-primary ring-offset-2" : ""
            }`}
            onClick={() => onFilterChange(isActive ? null : filter.id)}
            data-testid={`quick-filter-${filter.id}`}
            title={filter.description}
          >
            <Icon className="h-3 w-3 mr-1.5" />
            <span className="text-xs font-medium">{filter.label}</span>
          </Badge>
        );
      })}
    </div>
  );
}
