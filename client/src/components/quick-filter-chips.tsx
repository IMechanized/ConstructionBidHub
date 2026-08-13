import { Clock, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";

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
    label: "Closing this week",
    icon: Clock,
    description: "Deadlines in the next 7 days",
    filterFn: (rfp) => {
      const deadline = new Date(rfp.deadline);
      const now = new Date();
      return deadline >= now && deadline <= addDays(now, 7);
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
    label: "High value",
    icon: DollarSign,
    description: "Projects over $500k",
    filterFn: (rfp) => (rfp.budgetMin || 0) >= 500000,
  },
  {
    id: "near-deadline",
    label: "≤ 3 days left",
    icon: Calendar,
    description: "Closing in 3 days or less",
    filterFn: (rfp) => {
      const deadline = new Date(rfp.deadline);
      const now = new Date();
      return deadline >= now && deadline <= addDays(now, 3);
    },
  },
  {
    id: "next-month",
    label: "Next 30 days",
    icon: Calendar,
    description: "Closing within 30 days",
    filterFn: (rfp) => {
      const deadline = new Date(rfp.deadline);
      const now = new Date();
      return deadline >= now && deadline <= addDays(now, 30);
    },
  },
];

export function QuickFilterChips({ activeFilter, onFilterChange }: QuickFilterChipsProps) {
  return (
    <div className="flex gap-1.5 flex-wrap" data-testid="quick-filter-chips">
      {QUICK_FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(isActive ? null : filter.id)}
            title={filter.description}
            data-testid={`quick-filter-${filter.id}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-150 min-h-[36px] border",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground hover:bg-accent"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
