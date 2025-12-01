import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { User } from "@shared/schema";

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);

  // Get the token from the URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  useEffect(() => {
    // If no token is provided, redirect to login
    if (!token) {
      toast({
        title: "Verification failed",
        description: "No verification token provided",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Verify the email with the token
    const verifyEmail = async () => {
      try {
        const response = await apiRequest("GET", `/api/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          
          // If authenticated and user data returned, update the cache
          if (data.isAuthenticated && data.user) {
            // Merge with existing user data to maintain full user object
            const existingUser = queryClient.getQueryData<User>(["/api/user"]);
            if (existingUser) {
              const updatedUser = { ...existingUser, ...data.user };
              setVerifiedUser(updatedUser);
              queryClient.setQueryData(["/api/user"], updatedUser);
            }
          } else if (data.isAuthenticated) {
            // Authenticated but no user data, invalidate to refetch
            await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          }
          // For unauthenticated users, they will need to log in
          
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

  // If user is already verified and logged in, show appropriate message
  useEffect(() => {
    if (user && user.emailVerified) {
      setStatus("success");
      setMessage("Your email is already verified!");
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            Verifying your email address for FindConstructionBids
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">
                Verifying your email address...
              </p>
            </>
          )}
          
          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center font-medium text-lg">{message}</p>
              <p className="text-center text-muted-foreground mt-2">
                Thank you for verifying your email address. You can now fully use all features of FindConstructionBids.
              </p>
            </>
          )}
          
          {status === "error" && (
            <>
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <p className="text-center font-medium text-lg">Verification Failed</p>
              <p className="text-center text-muted-foreground mt-2">
                {message}
              </p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
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
            className="w-full max-w-xs"
            data-testid="button-continue"
          >
            {(verifiedUser || user) ? ((verifiedUser || user)?.onboardingComplete ? "Go to Dashboard" : "Continue to Onboarding") : "Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}