import { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Mail, CheckCircle, Edit2, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";

const updateEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type UpdateEmailFormValues = z.infer<typeof updateEmailSchema>;

export default function EmailVerificationPendingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logoutMutation, isLoading } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const form = useForm<UpdateEmailFormValues>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  useEffect(() => {
    if (user?.email) {
      form.setValue("email", user.email);
    }
  }, [user?.email, form]);

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await apiRequest("POST", "/api/resend-verification");

      if (response.ok) {
        setResendSuccess(true);
        toast({
          title: "Email sent",
          description: "Please check your inbox for the verification link",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to send email",
          description: errorData.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Request failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleUpdateEmail = async (data: UpdateEmailFormValues) => {
    setIsUpdatingEmail(true);

    try {
      const response = await apiRequest("POST", "/api/update-email", data);

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        setIsEditingEmail(false);
        setResendSuccess(true);
        toast({
          title: "Email updated",
          description: "A verification email has been sent to your new address",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to update email",
          description: errorData.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Request failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (user.emailVerified) {
    return <Redirect to={user.onboardingComplete ? "/dashboard" : "/onboarding"} />;
  }

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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Verify your email</h1>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-xs mx-auto">
              We sent a verification link to your email. Click the link to activate your account.
            </p>
          </div>

          {/* Email display / edit */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4">
            {!isEditingEmail ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Sent to</p>
                  <p className="text-sm font-medium text-foreground truncate" data-testid="text-current-email">
                    {user.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    form.setValue("email", user.email);
                    setIsEditingEmail(true);
                  }}
                  data-testid="button-edit-email"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdateEmail)} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground">Update email address</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="h-6 w-6"
                      onClick={() => setIsEditingEmail(false)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">New email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@company.com"
                            disabled={isUpdatingEmail}
                            data-testid="input-new-email"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-9 text-sm"
                    disabled={isUpdatingEmail}
                    data-testid="button-update-email"
                  >
                    {isUpdatingEmail ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Updating…
                      </>
                    ) : (
                      "Update & resend"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </div>

          {/* Resend success */}
          {resendSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 mb-4">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <p className="text-xs">Verification email sent. Check your inbox.</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center mb-4">
            Didn't receive the email? Check your spam folder or resend below.
          </p>

          <div className="space-y-2">
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full h-10"
              data-testid="button-resend-verification"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => logoutMutation.mutate()}
              className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
              data-testid="button-logout"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
