import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";

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
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Verifying reset link…</p>
          </div>
        );

      case "invalid":
        return (
          <div className="flex flex-col items-center text-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-foreground">Invalid reset link</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                This link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <Button
              onClick={() => navigate("/forgot-password")}
              variant="outline"
              className="mt-2"
            >
              Request new link
            </Button>
          </div>
        );

      case "valid":
        return (
          <>
            <div className="mb-5">
              <h1 className="text-xl font-semibold text-foreground">Set new password</h1>
              <p className="text-sm text-muted-foreground mt-1">Choose a password with at least 8 characters.</p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">New password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={isSubmitting}
                          data-testid="input-password"
                          className="h-10"
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
                      <FormLabel className="text-sm">Confirm password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={isSubmitting}
                          data-testid="input-confirm-password"
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={isSubmitting}
                  data-testid="button-reset-password"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting ? "Saving…" : "Set new password"}
                </Button>
              </form>
            </Form>
          </>
        );

      case "success":
        return (
          <div className="flex flex-col items-center text-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Password updated</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your password has been reset. You can now log in with your new credentials.
              </p>
            </div>
            <Button
              onClick={() => navigate("/auth")}
              className="mt-2"
              data-testid="button-back-login"
            >
              Go to login
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal top bar */}
      <div className="px-6 py-4 border-b border-border">
        <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
