import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import ContractorDashboard from "@/pages/dashboard/contractor";
import GovernmentDashboard from "@/pages/dashboard/government";
import OnboardingForm from "@/components/onboarding-form";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding/:userType" component={({ params }) => (
        <ProtectedRoute
          path="/onboarding/:userType"
          component={() => <OnboardingForm userType={params.userType as "contractor" | "government"} />}
        />
      )} />
      <ProtectedRoute path="/dashboard/contractor" component={ContractorDashboard} />
      <ProtectedRoute path="/dashboard/government" component={GovernmentDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;