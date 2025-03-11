import { Link } from "wouter";
import {
  FileText,
  Star,
  Clock,
  AlertCircle,
  MessageSquare,
  Settings,
  Building,
  Home,
  Users,
  FileBarChart,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
} from "@/components/ui/sidebar";

interface DashboardSidebarProps {
  currentPath: string;
}

export function DashboardSidebar({ currentPath }: DashboardSidebarProps) {
  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "RFPs",
      icon: FileText,
      items: [
        { label: "My RFPs", href: "/dashboard/rfps" },
        { label: "Featured", href: "/dashboard/featured" },
        { label: "New", href: "/dashboard/new" },
        { label: "Available", href: "/dashboard/available" },
      ],
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
      icon: AlertCircle,
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
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="border-b">
          <Link href="/" className="flex items-center gap-2 px-2">
            <Building className="h-6 w-6" />
            <span className="font-semibold text-lg">FindConstructionBids</span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) =>
              item.items ? (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    className="justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.href}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={currentPath === subItem.href}
                        >
                          <Link href={subItem.href}>{subItem.label}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={currentPath === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t">
          <SidebarTrigger />
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
