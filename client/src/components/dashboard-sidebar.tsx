import { Link } from "wouter";
import {
  Menu,
  FileText,
  MessageSquare,
  Settings,
  Building,
  Users,
  FileBarChart,
  HelpCircle,
  BarChart3,
  Star,
  Clock,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardSidebarProps {
  currentPath: string;
}

export function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();

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
      label: "Employees",
      href: "/dashboard/employees",
      icon: Users,
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

  const NavigationContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between py-4 px-2 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Building className="h-6 w-6" />
          <span className="font-semibold text-lg">FindConstructionBids</span>
        </Link>
        <ThemeToggle variant="ghost" />
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
          className="w-full justify-start mt-2"
          onClick={() => logoutMutation.mutate()}
        >
          Logout
        </Button>
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
            className="fixed top-4 left-4 md:hidden z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <NavigationContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:block fixed top-0 left-0 w-[280px] h-screen border-r bg-background">
      <NavigationContent />
    </div>
  );
}