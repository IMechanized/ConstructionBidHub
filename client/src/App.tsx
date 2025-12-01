import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/use-auth";
import { HelmetProvider } from 'react-helmet-async';
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import Dashboard from "@/pages/dashboard";
import OnboardingForm from "@/components/onboarding-form";
import { ProtectedRoute } from "./lib/protected-route";
import AboutPage from "@/pages/about";
import SupportPage from "@/pages/support";
import TermsPage from "@/pages/terms";
import RfpDetailPage from "@/pages/rfp/[id]";
import AnalyticsDashboard from "@/pages/dashboard/analytics";
import OpportunitiesPage from "@/pages/opportunities/[type]";
import DetailedReportPage from "@/pages/reports/[id]";
import AllRfps from "@/pages/dashboard/all";
import NewRfps from "@/pages/dashboard/new";
import FeaturedRfps from "@/pages/dashboard/featured";
import MyRfpsPage from "@/pages/dashboard/my-rfps";
import RfiPage from "@/pages/dashboard/rfis";
import ReportsPage from "@/pages/dashboard/reports";
import SettingsPage from "@/pages/dashboard/settings";
import DashboardSupportPage from "@/pages/dashboard/support";
import RfiManagementPage from "@/pages/dashboard/rfi-management/[id]";
import VerifyEmailPage from "@/pages/verify-email-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import EmailVerificationPendingPage from "@/pages/email-verification-pending";
import { ThemeProvider } from "@/components/theme-provider";
import HotReload from "@/components/hot-reload";
import { UpdateNotifier } from "@/components/update-notifier";
import { Toaster } from "@/components/ui/toaster";

// Import i18n configuration
import "./lib/i18n";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/opportunities/:type" component={OpportunitiesPage} />
      <Route path="/onboarding">
        <ProtectedRoute path="/onboarding" component={() => <OnboardingForm />} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute path="/dashboard" component={Dashboard} />
      </Route>
      <Route path="/dashboard/my-rfps">
        <ProtectedRoute path="/dashboard/my-rfps" component={MyRfpsPage} />
      </Route>
      <Route path="/dashboard/all">
        <ProtectedRoute path="/dashboard/all" component={AllRfps} />
      </Route>
      <Route path="/dashboard/new">
        <ProtectedRoute path="/dashboard/new" component={NewRfps} />
      </Route>
      <Route path="/dashboard/featured">
        <ProtectedRoute path="/dashboard/featured" component={FeaturedRfps} />
      </Route>
      <Route path="/dashboard/rfis">
        <ProtectedRoute path="/dashboard/rfis" component={RfiPage} />
      </Route>
      <Route path="/dashboard/reports">
        <ProtectedRoute path="/dashboard/reports" component={ReportsPage} />
      </Route>
      <Route path="/dashboard/settings">
        <ProtectedRoute path="/dashboard/settings" component={SettingsPage} />
      </Route>
      <Route path="/dashboard/analytics">
        <ProtectedRoute path="/dashboard/analytics" component={AnalyticsDashboard} />
      </Route>
      <Route path="/dashboard/support">
        <ProtectedRoute path="/dashboard/support" component={DashboardSupportPage} />
      </Route>
      <Route path="/dashboard/rfi-management/:id">
        <ProtectedRoute path="/dashboard/rfi-management/:id" component={RfiManagementPage} />
      </Route>
      <Route path="/reports/:id">
        <ProtectedRoute path="/reports/:id" component={() => <DetailedReportPage />} />
      </Route>
      <Route path="/rfp/:id" component={RfpDetailPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/email-verification-pending" component={EmailVerificationPendingPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme="light" storageKey="fcb-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router />
            <Toaster />
            <UpdateNotifier />
            {import.meta.env.DEV && <HotReload />}
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;