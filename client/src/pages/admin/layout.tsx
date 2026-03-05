import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [, setLocation] = useLocation();

  const { data: adminStatus, isLoading } = useQuery({
    queryKey: ["/api/admin/status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/status", { credentials: "include" });
      if (!res.ok) return { isAdmin: false };
      return res.json();
    },
  });

  useEffect(() => {
    if (!isLoading && adminStatus && !adminStatus.isAdmin) {
      setLocation("/dashboard");
    }
  }, [isLoading, adminStatus, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" aria-label="Loading" />
      </div>
    );
  }

  if (!adminStatus?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AdminSidebar />
      <main
        className="ml-64 min-h-screen"
        id="main-content"
        role="main"
      >
        <div className="mx-auto max-w-[1440px] p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
