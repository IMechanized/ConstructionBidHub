import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, CreditCard, TrendingUp, Shield } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950">
          <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminOverview() {
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users", 1, ""],
    queryFn: async () => {
      const res = await fetch("/api/admin/users?page=1&limit=1", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: rfpsData, isLoading: rfpsLoading } = useQuery({
    queryKey: ["/api/admin/rfps", 1, ""],
    queryFn: async () => {
      const res = await fetch("/api/admin/rfps?page=1&limit=1", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch RFPs");
      return res.json();
    },
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/admin/payments", 1],
    queryFn: async () => {
      const res = await fetch("/api/admin/payments?page=1&limit=1", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
  });

  const { data: draftsData, isLoading: draftsLoading } = useQuery({
    queryKey: ["/api/admin/rfp-drafts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rfp-drafts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch drafts");
      return res.json();
    },
  });

  const draftCount = Array.isArray(draftsData) ? draftsData.length : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600">
            <Shield className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
            <p className="text-muted-foreground">Platform-wide summary and quick actions</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={usersData?.total ?? "—"}
            icon={Users}
            description="Registered accounts"
            isLoading={usersLoading}
          />
          <StatCard
            title="Total RFPs"
            value={rfpsData?.total ?? "—"}
            icon={FileText}
            description="All solicitations"
            isLoading={rfpsLoading}
          />
          <StatCard
            title="Total Payments"
            value={paymentsData?.total ?? "—"}
            icon={CreditCard}
            description="All transactions"
            isLoading={paymentsLoading}
          />
          <StatCard
            title="Pending Drafts"
            value={draftCount}
            icon={TrendingUp}
            description="Awaiting review"
            isLoading={draftsLoading}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/rfp-import">
                <Button className="w-full bg-violet-600 hover:bg-violet-700" size="lg">
                  Import RFPs from JSON
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full" size="lg">
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/rfps">
                <Button variant="outline" className="w-full" size="lg">
                  Manage RFPs
                </Button>
              </Link>
            </CardContent>
          </Card>

          {draftCount > 0 && (
            <Card className="border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800">
              <CardHeader>
                <CardTitle className="text-base text-violet-700 dark:text-violet-300">
                  Drafts Awaiting Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  You have <strong>{draftCount}</strong> imported RFP{draftCount !== 1 ? "s" : ""} waiting to be reviewed and published.
                </p>
                <Link href="/admin/rfp-import">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    Review Drafts
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
