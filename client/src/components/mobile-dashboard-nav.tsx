import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, FileText, Star, Clock, AlertCircle, MessageSquare, Settings, Building, Home } from "lucide-react";

interface MobileDashboardNavProps {
  userType: "contractor" | "government";
  currentPath: string;
}

export function MobileDashboardNav({ userType, currentPath }: MobileDashboardNavProps) {
  const navItems = userType === "contractor" 
    ? [
        { label: "Dashboard", href: "/dashboard/contractor", icon: Home },
        { label: "Browse RFPs", href: "/dashboard/contractor/rfps", icon: FileText },
        { label: "My Bids", href: "/dashboard/contractor/bids", icon: Star },
        { label: "My Company", href: "/dashboard/contractor/profile", icon: Building },
        { label: "Settings", href: "/dashboard/contractor/settings", icon: Settings },
      ]
    : [
        { label: "Dashboard", href: "/dashboard", icon: Home },
        { label: "My RFPs", href: "/dashboard/rfps", icon: FileText },
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { label: "Analytics", href: "/dashboard/analytics", icon: AlertCircle },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ];

  return (
    <div className="block md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-2 z-30">
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
                    className="w-full justify-start gap-3"
                  >
                    <item.icon className="h-4 w-4" />
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