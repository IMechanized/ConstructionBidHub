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
import { Logo } from "@/components/ui/logo";
import { Link } from "wouter";

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

  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

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

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-3" />
            <p className="text-[0.875rem] text-muted-foreground">
              Verifying your reset token…
            </p>
          </div>
        );
        
      case "invalid":
        return (
          <div className="flex flex-col items-center py-8">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <p className="font-medium text-[0.9375rem] mb-1">Invalid Reset Link</p>
            <p className="text-[0.875rem] text-muted-foreground text-center leading-relaxed">
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
                    <FormLabel className="text-[0.8125rem]">New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="At least 8 characters"
                        className="h-9"
                        disabled={isSubmitting}
                        data-testid="input-password"
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
                    <FormLabel className="text-[0.8125rem]">Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Repeat your new password"
                        className="h-9"
                        disabled={isSubmitting}
                        data-testid="input-confirm-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full h-9 text-[0.875rem]"
                disabled={isSubmitting}
                data-testid="button-reset-password"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Resetting…" : "Reset Password"}
              </Button>
            </form>
          </Form>
        );
        
      case "success":
        return (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="h-10 w-10 text-primary mb-3" />
            <p className="font-medium text-[0.9375rem] mb-1">Password Reset Successful</p>
            <p className="text-[0.875rem] text-muted-foreground text-center leading-relaxed">
              Your password has been reset. You can now log in with your new password.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <Card className="border-border">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-[1.25rem] font-semibold">Reset your password</CardTitle>
            <CardDescription className="text-[0.875rem]">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
          <CardFooter className="pt-0">
            {(status === "invalid" || status === "success") && (
              <Button 
                onClick={() => navigate("/auth")}
                className="w-full h-9 text-[0.875rem]"
                data-testid="button-back-login"
              >
                Back to Login
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
