import { Link } from "wouter";
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
  Shield,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  currentPath: string;
}

export function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);

  const navItems = [
    ...(user?.isAdmin ? [{
      label: "Admin Panel",
      href: "/admin",
      icon: Shield,
      isAdmin: true,
    }] : []),
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: t('sidebar.myRfps'),
      href: "/dashboard/my-rfps",
      icon: FileText,
    },
    {
      label: t('sidebar.featuredRfps'),
      href: "/dashboard/featured",
      icon: Star,
    },
    {
      label: t('sidebar.newRfps'),
      href: "/dashboard/new",
      icon: Clock,
    },
    {
      label: t('sidebar.allRfps'),
      href: "/dashboard/all",
      icon: Layout,
    },
    {
      label: t('sidebar.rfis'),
      href: "/dashboard/rfis",
      icon: MessageSquare,
    },
    {
      label: t('sidebar.reports'),
      href: "/dashboard/reports",
      icon: FileBarChart,
    },
    {
      label: t('sidebar.analytics'),
      href: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      label: t('sidebar.settings'),
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      label: t('sidebar.support'),
      href: "/dashboard/support",
      icon: HelpCircle,
    },
  ];

  const NavigationContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo / Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border shrink-0">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity duration-150">
          <Logo />
        </Link>
        <NotificationCenter />
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 min-h-[44px] text-[0.8125rem] font-medium leading-none transition-colors duration-150",
                    isActive
                      ? "bg-sidebar-accent text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-2 h-11 text-[0.8125rem] text-muted-foreground hover:text-foreground"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('auth.logout')}
          </Button>
          <ThemeToggle variant="ghost" className="h-11 w-11 px-0" />
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-2.5 left-2.5 md:hidden z-50 h-11 w-11"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-sidebar-border">
          <NavigationContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:flex md:flex-col fixed top-0 left-0 w-[280px] h-screen border-r border-sidebar-border bg-sidebar">
      <NavigationContent />
    </div>
  );
}
