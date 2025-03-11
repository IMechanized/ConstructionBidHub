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
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface MobileDashboardNavProps {
  userType: "contractor" | "government";
  currentPath: string;
}

export function MobileDashboardNav({ userType, currentPath }: MobileDashboardNavProps) {
  const navItems = userType === "contractor" 
    ? [
        { label: "Dashboard", href: "/dashboard/contractor" },
        { label: "Browse RFPs", href: "/dashboard/contractor/rfps" },
        { label: "My Bids", href: "/dashboard/contractor/bids" },
        { label: "My Company", href: "/dashboard/contractor/profile" },
        { label: "Settings", href: "/dashboard/contractor/settings" },
      ]
    : [
        { label: "Dashboard", href: "/dashboard/government" },
        { label: "My RFPs", href: "/dashboard/government/rfps" },
        { label: "Messages", href: "/dashboard/government/messages" },
        { label: "Organization", href: "/dashboard/government/profile" },
        { label: "Settings", href: "/dashboard/government/settings" },
      ];

  return (
    <div className="block md:hidden sticky bottom-0 left-0 right-0 bg-background border-t p-2 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
            <Menu className="h-4 w-4" />
            <span>Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh]">
          <div className="grid gap-4 py-4">
            <h2 className="text-lg font-semibold mb-2">Navigation</h2>
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant={currentPath === item.href ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
