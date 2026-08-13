import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/request-password-reset", data);

      if (response.ok) {
        setEmailSent(true);
      } else {
        const errorData = await response.json();
        toast({
          title: "Something went wrong",
          description: errorData.message || "Failed to send reset email. Please try again.",
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
      setIsSubmitting(false);
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
          {!emailSent ? (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@company.com"
                            type="email"
                            disabled={isSubmitting}
                            data-testid="input-email"
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
                    data-testid="button-send-reset"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
              </Form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Check your inbox</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                If that email address is in our system, you'll receive a password reset link shortly. Check your spam folder if it doesn't arrive.
              </p>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              data-testid="button-back-login"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
