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
  LayoutDashboard,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import "./mobile-dashboard-styles.css";

interface MobileDashboardNavProps {
  currentPath: string;
}

export function MobileDashboardNav({ currentPath }: MobileDashboardNavProps) {
  const { user, logoutMutation } = useAuth();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My RFPs",
      href: "/dashboard/my-rfps",
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
      href: "/dashboard/support",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="block md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center justify-center gap-2 h-12 rounded-none text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <Menu className="h-4 w-4" />
            <span className="text-[0.8125rem] font-medium">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] p-0 bg-sidebar border-sidebar-border mobile-sheet">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border shrink-0">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity duration-150">
                <Logo />
              </Link>
              <div className="flex items-center gap-2">
                <ThemeToggle variant="ghost" />
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-3 px-2">
              <ul className="space-y-0.5">
                {navItems.map((item) => {
                  const isActive = currentPath === item.href;
                  return (
                    <li key={item.href}>
                      <SheetClose asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-3 text-[0.8125rem] font-medium transition-colors duration-150 min-h-[44px]",
                            isActive
                              ? "bg-sidebar-accent text-primary"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <span>{item.label}</span>
                        </Link>
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User footer */}
            <div className="border-t border-sidebar-border px-4 py-4 shrink-0">
              {user && (
                <div className="flex items-center gap-3 mb-3">
                  {user.logo ? (
                    <Avatar className="h-8 w-8 shrink-0">
                      <img
                        src={user.logo}
                        alt={`${user.companyName} logo`}
                        className="h-full w-full object-cover"
                      />
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {user.companyName?.charAt(0) ?? "?"}
                      </span>
                    </div>
                  )}
                  <span className="text-[0.8125rem] font-medium text-sidebar-foreground truncate">
                    {user.companyName}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-11 text-[0.8125rem] text-muted-foreground hover:text-foreground"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
