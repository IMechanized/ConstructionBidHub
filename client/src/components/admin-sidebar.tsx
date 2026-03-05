import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Upload,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "RFPs", href: "/admin/rfps", icon: FileText },
  { label: "RFP Import", href: "/admin/rfp-import", icon: Upload },
];

export function AdminSidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  function isActive(href: string, exact = false) {
    if (exact) return location === href;
    return location.startsWith(href);
  }

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-slate-950 text-white"
        aria-label="Admin navigation"
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Shield className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Admin Panel</p>
            <p className="text-xs text-slate-400 mt-0.5">FCB Platform</p>
          </div>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav aria-label="Admin menu">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <a
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                          active
                            ? "bg-violet-600 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1">{item.label}</span>
                        {active && (
                          <ChevronRight className="h-3 w-3 opacity-60" aria-hidden="true" />
                        )}
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Separator className="my-4 bg-slate-800" />

          <div className="space-y-1">
            <Link href="/dashboard">
              <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>User Dashboard</span>
              </a>
            </Link>
          </div>
        </ScrollArea>

        <div className="border-t border-slate-800 p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">Sign Out</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
