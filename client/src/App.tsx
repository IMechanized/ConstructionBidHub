import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/use-auth";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
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
        <ProtectedRoute
          path="/onboarding"
          component={OnboardingForm}
        />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute
          path="/dashboard"
          component={Dashboard}
        />
      </Route>
      <Route path="/dashboard/analytics">
        <ProtectedRoute
          path="/dashboard/analytics"
          component={AnalyticsDashboard}
        />
      </Route>
      <Route path="/rfp/:id" component={RfpDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <MantineProvider
      defaultColorScheme="auto"
      theme={{
        primaryColor: 'blue',
        fontFamily: 'Inter, sans-serif',
        headings: { fontFamily: 'Inter, sans-serif' },
      }}
    >
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
}

export default App;