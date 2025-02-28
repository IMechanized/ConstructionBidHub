import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Star, Clock, LayoutDashboard, AlertCircle } from "lucide-react";

interface MobileDashboardNavProps {
  userType: "contractor";
  currentPath: string;
}

export function MobileDashboardNav({ userType, currentPath }: MobileDashboardNavProps) {
  const navItems = [
    {
      label: "My RFPs",
      icon: FileText,
      href: "/dashboard",
      active: currentPath === "/dashboard"
    },
    {
      label: "Featured",
      icon: Star,
      href: "/dashboard/featured",
      active: currentPath === "/dashboard/featured"
    },
    {
      label: "New",
      icon: Clock,
      href: "/dashboard/new",
      active: currentPath === "/dashboard/new"
    },
    {
      label: "Analytics",
      icon: AlertCircle,
      href: "/dashboard/analytics",
      active: currentPath === "/dashboard/analytics"
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            size="sm"
            asChild
            className={`flex-1 flex flex-col items-center gap-1 h-full rounded-none ${
              item.active ? "bg-accent" : ""
            }`}
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}