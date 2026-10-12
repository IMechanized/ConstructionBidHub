import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UnifiedReportPage from "./[id]";
import CertificationReportPage from "./certification/[id]";

const fixture = vi.hoisted(() => ({
  goals: ["MBE"] as string[],
  certifications: [["MBE"], []] as string[][],
}));
vi.mock("@/lib/report-pdf", () => ({ exportReportPdf: vi.fn() }));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: 1, companyName: "Report QA" } }),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("wouter", () => ({
  useParams: () => ({ id: "1" }),
  useLocation: () => ["/reports/1", vi.fn()],
}));
vi.mock("@/components/dashboard-sidebar", () => ({ DashboardSidebar: () => null }));
vi.mock("@/components/breadcrumb-nav", () => ({ BreadcrumbNav: () => null }));
vi.mock("@/components/skeletons", () => ({ ReportDetailSkeleton: () => null }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    const key = queryKey[0];
    const data = key.endsWith("/rfi")
      ? fixture.certifications.map((certificationName, id) => ({
        id, email: `bidder-${id}@example.test`, createdAt: "2026-10-01",
        organization: { companyName: `Bidder ${id}`, certificationName },
      }))
      : key.includes("/views") ? []
      : {
        id: 1, organizationId: 1, title: "Warm Stone Report", jobCity: "Denver",
        jobState: "CO", deadline: "2026-12-01", certificationGoals: fixture.goals,
      };
    return { data, isLoading: false };
  },
}));

describe.each([
  ["RFP report", UnifiedReportPage],
  ["Certification report", CertificationReportPage],
] as const)("%s semantic report states", (_, Page) => {
  it.each([
    { goals: ["MBE"], certs: [["MBE"], []], value: "50%", tone: "report-destructive" },
    { goals: ["MBE"], certs: [["MBE"], ["MBE"]], value: "100%", tone: "report-chart-green" },
    { goals: ["None"], certs: [["None"]], value: "—", tone: "report-muted" },
    { goals: ["MBE"], certs: [], value: "—", tone: "report-muted" },
  ])("uses $tone for $value", ({ goals, certs, value, tone }) => {
    fixture.goals = goals;
    fixture.certifications = certs;
    render(<Page />);
    const rate = within(screen.getByTestId("card-compliance-rate")).getByText(value);
    expect(rate).toHaveClass("report-metric", tone);
    expect(screen.getByTestId("text-report-title")).toHaveClass("report-title");
    expect(screen.getByTestId("button-download-pdf")).toBeEnabled();
    if (goals.includes("None")) {
      expect(screen.queryByText("RFP Certification Goals")).not.toBeInTheDocument();
    }
  });
});
