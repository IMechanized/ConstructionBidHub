import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { User } from "@shared/schema";
import { Logo } from "@/components/ui/logo";
import { Link } from "wouter";

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-[1.25rem] font-semibold">Email Verification</CardTitle>
            <CardDescription className="text-[0.875rem]">
              Verifying your email address for FindConstructionBids
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            {status === "loading" && (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
                <p className="text-[0.875rem] text-muted-foreground">
                  Verifying your email address…
                </p>
              </>
            )}
            
            {status === "success" && (
              <>
                <CheckCircle className="h-10 w-10 text-primary mb-4" />
                <p className="font-medium text-[0.9375rem] mb-1.5 text-center">{message}</p>
                <p className="text-[0.875rem] text-muted-foreground text-center leading-relaxed">
                  Thank you for verifying your email. You can now fully use FindConstructionBids.
                </p>
              </>
            )}
            
            {status === "error" && (
              <>
                <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                <p className="font-medium text-[0.9375rem] mb-1.5 text-center">Verification Failed</p>
                <p className="text-[0.875rem] text-muted-foreground text-center leading-relaxed">
                  {message}
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Button 
              onClick={() => {
                const currentUser = verifiedUser || user;
                if (currentUser) {
                  if (currentUser.onboardingComplete) {
                    navigate("/dashboard");
                  } else {
                    navigate("/onboarding");
                  }
                } else {
                  navigate("/auth");
                }
              }}
              className="w-full h-9 text-[0.875rem] max-w-none"
              data-testid="button-continue"
            >
              {(verifiedUser || user) ? ((verifiedUser || user)?.onboardingComplete ? "Go to Dashboard" : "Continue to Onboarding") : "Login"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
