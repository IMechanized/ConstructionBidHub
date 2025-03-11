import { Link } from "wouter";
import {
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface DashboardSidebarProps {
  currentPath: string;
}

export function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
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
      label: "RFIs",
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
      href: "/support",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="w-full md:w-auto">
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b">
          <Link href="/" className="flex items-center gap-2 px-2">
            <Building className="h-6 w-6" />
            <span className="font-semibold text-lg">FindConstructionBids</span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  isActive={currentPath === item.href}
                >
                  <Link href={item.href} className="flex items-center w-full">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t space-y-4">
          <div className="px-2 py-2">
            <div className="flex items-center gap-3 mb-2">
              {user?.logo && (
                <img
                  src={user.logo}
                  alt={`${user.companyName} logo`}
                  className="h-8 w-8 object-contain rounded-full"
                />
              )}
              <span className="text-sm font-medium truncate">
                {user?.companyName}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </Button>
          </div>
          <SidebarSeparator />
          <SidebarTrigger />
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}