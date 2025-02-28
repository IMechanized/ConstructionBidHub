import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings,
  AlertCircle 
} from "lucide-react";

interface MobileDashboardNavProps {
  userType: "government" | "contractor";
  currentPath: string;
}

export function MobileDashboardNav({ userType, currentPath }: MobileDashboardNavProps) {
  const navItems = userType === "government" 
    ? [
        {
          label: "RFPs",
          icon: FileText,
          href: "/dashboard",
          active: currentPath === "/dashboard"
        },
        {
          label: "New",
          icon: AlertCircle,
          href: "/dashboard/new",
          active: currentPath === "/dashboard/new"
        },
        {
          label: "Team",
          icon: Users,
          href: "/dashboard/employees",
          active: currentPath === "/dashboard/employees"
        }
      ]
    : [
        {
          label: "RFPs",
          icon: FileText,
          href: "/dashboard",
          active: currentPath === "/dashboard"
        },
        {
          label: "Bids",
          icon: LayoutDashboard,
          href: "/dashboard/bids",
          active: currentPath === "/dashboard/bids"
        },
        {
          label: "Team",
          icon: Users,
          href: "/dashboard/employees",
          active: currentPath === "/dashboard/employees"
        },
        {
          label: "Settings",
          icon: Settings,
          href: "/dashboard/settings",
          active: currentPath === "/dashboard/settings"
        }
      ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full",
              "text-xs gap-1 py-1",
              item.active 
                ? "text-primary border-t-2 border-primary" 
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <item.icon className="h-6 w-6" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}