import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import {
  Menu,
  FileText,
  MessageSquare,
  Settings,
  FileBarChart,
  HelpCircle,
  BarChart3,
  Star,
  Clock,
  Layout,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import "./mobile-dashboard-styles.css";

interface MobileDashboardNavProps {
  currentPath: string;
}

export function MobileDashboardNav({ currentPath }: MobileDashboardNavProps) {
  const { user, logoutMutation } = useAuth();

  const navItems = [
    {
      label: "My RFPs",
      href: "/dashboard",
      icon: FileText,
    },
    {
      label: "Featured RFPs",
      href: "/dashboard/featured",
      icon: Star,
    },
    {
      label: "New RFPs",
      href: "/dashboard/new",
      icon: Clock,
    },
    {
      label: "All RFPs",
      href: "/dashboard/all",
      icon: Layout,
    },
    {
      label: "My RFIs",
      href: "/dashboard/rfis",
      icon: MessageSquare,
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: FileBarChart,
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      label: "Support",
      href: "/support",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="block md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-center gap-2 h-12 rounded-none hover:bg-accent"
          >
            <Menu className="h-4 w-4" />
            <span className="text-sm">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] mobile-sheet">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between py-4 px-2 border-b">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <img src="/fcb-logo.png" alt="FCB Logo" className="h-10" />
              </Link>
              <div className="flex items-center gap-3">
                <ThemeToggle variant="ghost" />
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9">
                    <X className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              <div className="grid gap-1">
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    variant={currentPath === item.href ? "default" : "ghost"}
                    className="w-full justify-start gap-3"
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </nav>

            <div className="border-t p-4">
              <div className="flex items-center gap-3 mb-4">
                {user?.logo && (
                  <Avatar>
                    <img
                      src={user.logo}
                      alt={`${user.companyName} logo`}
                      className="h-full w-full object-cover"
                    />
                  </Avatar>
                )}
                <span className="font-medium">{user?.companyName}</span>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => logoutMutation.mutate()}
              >
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}