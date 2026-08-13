import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { User } from "@shared/schema";
import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  useEffect(() => {
    if (!token) {
      toast({
        title: "Verification failed",
        description: "No verification token provided",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await apiRequest("GET", `/api/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");

          if (data.isAuthenticated && data.user) {
            const existingUser = queryClient.getQueryData<User>(["/api/user"]);
            if (existingUser) {
              const updatedUser = { ...existingUser, ...data.user };
              setVerifiedUser(updatedUser);
              queryClient.setQueryData(["/api/user"], updatedUser);
            }
          } else if (data.isAuthenticated) {
            await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          }

          toast({
            title: "Email verified",
            description: "Your email has been successfully verified!",
          });
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to verify email. The token may be invalid or expired.");

          toast({
            title: "Verification failed",
            description: data.message || "Failed to verify email",
            variant: "destructive",
          });
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during email verification. Please try again later.");

        toast({
          title: "Verification error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [token, toast, navigate]);

  useEffect(() => {
    if (user && user.emailVerified) {
      setStatus("success");
      setMessage("Your email is already verified!");
    }
  }, [user]);

  const currentUser = verifiedUser || user;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal top bar */}
      <div className="px-6 py-4 border-b border-border">
        <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Verifying your email…</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{message}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xs mx-auto">
                  Your email has been verified. You now have full access to FindConstructionBids.
                </p>
              </div>
              <Button
                className="mt-2"
                onClick={() => {
                  if (currentUser) {
                    navigate(currentUser.onboardingComplete ? "/dashboard" : "/onboarding");
                  } else {
                    navigate("/auth");
                  }
                }}
                data-testid="button-continue"
              >
                {currentUser
                  ? (currentUser.onboardingComplete ? "Go to Dashboard" : "Continue to Onboarding")
                  : "Login"}
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Verification failed</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xs mx-auto">
                  {message}
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => navigate("/auth")}
                data-testid="button-continue"
              >
                Back to login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
