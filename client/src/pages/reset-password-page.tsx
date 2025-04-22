import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form validation schema
const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "success">("loading");
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the token from the URL
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Verify the token when the component mounts
  useEffect(() => {
    const verifyToken = async () => {
      if (!urlToken) {
        setStatus("invalid");
        toast({
          title: "Invalid request",
          description: "No reset token provided",
          variant: "destructive",
        });
        return;
      }

      try {
        const response = await apiRequest("GET", `/api/verify-reset-token?token=${urlToken}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("valid");
          setToken(urlToken);
        } else {
          setStatus("invalid");
          toast({
            title: "Invalid token",
            description: data.message || "The reset token is invalid or has expired",
            variant: "destructive",
          });
        }
      } catch (error) {
        setStatus("invalid");
        toast({
          title: "Verification error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    };

    verifyToken();
  }, [urlToken, toast]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/reset-password", {
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      
      if (response.ok) {
        setStatus("success");
        toast({
          title: "Password reset successful",
          description: "Your password has been successfully reset",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Reset failed",
          description: errorData.message || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Reset error",
        description: "An unexpected error occurred during password reset",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Content based on status
  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <p className="text-center text-muted-foreground">
              Verifying your reset token...
            </p>
          </div>
        );
        
      case "invalid":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <p className="text-center font-medium text-lg">Invalid Reset Link</p>
            <p className="text-center text-muted-foreground mt-2">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
        );
        
      case "valid":
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your new password" 
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm your new password" 
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        );
        
      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-center font-medium text-lg">Password Reset Successful!</p>
            <p className="text-center text-muted-foreground mt-2">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        <CardFooter className="flex justify-center">
          {(status === "invalid" || status === "success") && (
            <Button 
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Back to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}