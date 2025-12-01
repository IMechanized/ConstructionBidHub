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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditingEmail ? (
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Email address</p>
                  <p className="font-medium" data-testid="text-current-email">{user.email}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    form.setValue("email", user.email);
                    setIsEditingEmail(true);
                  }}
                  data-testid="button-edit-email"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdateEmail)} className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Update email address</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      type="button"
                      onClick={() => setIsEditingEmail(false)}
                    >
                      <X className="h-4 w-4" />
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
                    className="w-full"
                    disabled={isUpdatingEmail}
                    data-testid="button-update-email"
                  >
                    {isUpdatingEmail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update & Send Verification"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {resendSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Verification email sent! Please check your inbox.</p>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>Didn't receive the email? Check your spam folder or click below to resend.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button 
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full"
            data-testid="button-resend-verification"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => logoutMutation.mutate()}
            className="w-full"
            data-testid="button-logout"
          >
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
