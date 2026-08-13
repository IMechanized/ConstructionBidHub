import { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Mail, CheckCircle, Edit2, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Logo } from "@/components/ui/logo";
import { Link } from "wouter";

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
          title: "Verification email sent",
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
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <Card className="border-border">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-[1.25rem] font-semibold">Verify Your Email</CardTitle>
            <CardDescription className="text-[0.875rem] leading-relaxed">
              We've sent a verification link to your email address. Click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isEditingEmail ? (
              <div className="bg-muted/50 rounded-[6px] border border-border p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.75rem] text-muted-foreground mb-0.5">Email address</p>
                    <p className="text-[0.875rem] font-medium truncate" data-testid="text-current-email">{user.email}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="shrink-0 h-8 text-[0.8125rem]"
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
              </div>
            ) : (
              <div className="bg-muted/50 rounded-[6px] border border-border p-3.5">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleUpdateEmail)} className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[0.8125rem] font-medium">Update email address</p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        type="button"
                        className="h-7 w-7 p-0"
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
                          <FormLabel className="sr-only">New Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter new email address"
                              className="h-9"
                              disabled={isUpdatingEmail}
                              data-testid="input-new-email"
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
                      disabled={isUpdatingEmail}
                      data-testid="button-update-email"
                    >
                      {isUpdatingEmail ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating…
                        </>
                      ) : (
                        "Update & Resend Verification"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {resendSuccess && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-[6px] bg-muted border border-border">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                <p className="text-[0.8125rem] text-foreground">Verification email sent. Check your inbox.</p>
              </div>
            )}

            <p className="text-[0.8125rem] text-muted-foreground text-center">
              Didn't receive the email? Check your spam folder or resend below.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-0">
            <Button 
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full h-9 text-[0.875rem]"
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
                  Resend Verification Email
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => logoutMutation.mutate()}
              className="w-full h-9 text-[0.875rem] text-muted-foreground"
              data-testid="button-logout"
            >
              Logout
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
