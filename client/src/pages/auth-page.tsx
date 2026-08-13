import { useEffect } from "react";
import SEOHead from "@/components/seo-head";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { Link } from "wouter";
import { Logo } from "@/components/ui/logo";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      companyName: "",
      companyWebsite: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex">
      <SEOHead
        title="Sign In or Register - FindConstructionBids"
        description="Sign in to your FindConstructionBids account or create a new one. Access construction bid management tools and contractor opportunities."
        canonical="https://findconstructionbids.com/auth"
        noindex={true}
      />

      {/* Form side */}
      <div className="flex-1 flex flex-col">
        {/* Minimal top bar */}
        <div className="px-6 py-4 border-b border-border">
          <Link href="/" className="inline-flex items-center hover:opacity-80 transition-opacity">
            <Logo />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-9">
                <TabsTrigger value="login" className="text-sm">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-sm">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <div className="mb-5">
                  <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
                  <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
                </div>
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit((data) => {
                      loginMutation.mutate(data);
                    })}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="name@company.com" className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm">Password</FormLabel>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                              type="button"
                              onClick={() => navigate("/forgot-password")}
                            >
                              Forgot password?
                            </Button>
                          </div>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="h-10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-10"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in…" : "Sign in"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <div className="mb-5">
                  <h1 className="text-xl font-semibold text-foreground">Create an account</h1>
                  <p className="text-sm text-muted-foreground mt-1">Free to get started</p>
                </div>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Organization name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-company-name" className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Website <span className="text-muted-foreground font-normal">(optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="www.example.com"
                              {...field}
                              data-testid="input-company-website"
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="name@company.com" {...field} className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-10"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account…" : "Create account"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      By registering you agree to our{" "}
                      <Link href="/terms" className="underline hover:text-foreground">Terms</Link>
                      {" "}and{" "}
                      <Link href="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.
                    </p>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Panel side — desktop only */}
      <div
        className="hidden lg:flex flex-1 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40')`
        }}
      >
        <div className="w-full h-full bg-foreground/60 p-14 flex items-end">
          <div className="max-w-sm text-white">
            <p className="text-lg font-semibold leading-snug mb-2">
              "We found three qualifying bids in under ten minutes."
            </p>
            <p className="text-sm opacity-70">General contractor, municipal infrastructure</p>
          </div>
        </div>
      </div>
    </div>
  );
}
