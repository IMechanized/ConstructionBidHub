import { useEffect } from "react";
import SEOHead from "@/components/seo-head";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { Logo } from "@/components/ui/logo";
import { Link } from "wouter";

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

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/">
              <Logo />
            </Link>
          </div>

          <Card className="border-border">
            <CardContent className="pt-6 px-6 pb-6">
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-5 h-9">
                  <TabsTrigger value="login" className="text-[0.8125rem]">Login</TabsTrigger>
                  <TabsTrigger value="register" className="text-[0.8125rem]">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form 
                      onSubmit={loginForm.handleSubmit((data) => {
                        loginMutation.mutate(data);
                      })}
                    >
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel className="text-[0.8125rem]">Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="name@company.com" className="h-9" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="mb-3">
                            <FormLabel className="text-[0.8125rem]">Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" className="h-9" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end mb-5">
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-[0.8125rem] text-muted-foreground hover:text-primary"
                          type="button"
                          onClick={() => navigate("/forgot-password")}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-9 text-[0.875rem]"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in…" : "Login"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}>
                      <FormField
                        control={registerForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel className="text-[0.8125rem]">Organization Name</FormLabel>
                            <FormControl>
                              <Input className="h-9" {...field} data-testid="input-company-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="companyWebsite"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel className="text-[0.8125rem]">
                              Company Website{" "}
                              <span className="text-muted-foreground font-normal">(optional)</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="www.example.com"
                                className="h-9"
                                {...field} 
                                data-testid="input-company-website" 
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
                          <FormItem className="mb-4">
                            <FormLabel className="text-[0.8125rem]">Email</FormLabel>
                            <FormControl>
                              <Input type="email" className="h-9" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="mb-5">
                            <FormLabel className="text-[0.8125rem]">Password</FormLabel>
                            <FormControl>
                              <Input type="password" className="h-9" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full h-9 text-[0.875rem]"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account…" : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-[0.8125rem] text-muted-foreground mt-5">
            <Link href="/" className="hover:text-foreground transition-colors">← Back to home</Link>
          </p>
        </div>
      </div>

      {/* Right panel — image */}
      <div 
        className="hidden lg:flex flex-1 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40')`
        }}
        aria-hidden="true"
      >
        <div className="w-full h-full bg-foreground/55 p-12 flex items-end">
          <div className="max-w-sm">
            <p className="text-[0.75rem] font-medium tracking-[0.06em] uppercase text-white/60 mb-2">
              FindConstructionBids
            </p>
            <p className="text-[1.25rem] font-semibold text-white leading-snug">
              Government construction bids, all in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
