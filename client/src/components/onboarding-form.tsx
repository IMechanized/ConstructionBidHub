import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { onboardingSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";

export default function OnboardingForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.onboardingComplete) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const form = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      contact: "",
      telephone: "",
      cell: "",
      businessEmail: "",
      isMinorityOwned: false,
      minorityGroup: "",
      department: "",
      jurisdiction: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/user/onboarding", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
      queryClient.refetchQueries({ queryKey: ["/api/user"] })
        .then(() => {
          navigate("/dashboard");
        })
        .catch((error) => {
          console.error("Error refetching user data:", error);
          navigate("/dashboard");
        });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-6">Complete Your Profile</h2>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Full Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telephone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Office Phone" type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cell"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cell Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Mobile Number" type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Business Email" type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isMinorityOwned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Minority-Owned Business
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("isMinorityOwned") && (
                <FormField
                  control={form.control}
                  name="minorityGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minority Group</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select minority group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            "African American",
                            "Hispanic American",
                            "Asian Pacific American",
                            "Native American",
                            "Subcontinent Asian American",
                            "Other"
                          ].map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Public Works" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jurisdiction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jurisdiction (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select jurisdiction level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          "Federal",
                          "State/Provincial",
                          "Municipal",
                          "Regional",
                          "Other"
                        ].map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full mt-6"
                disabled={updateProfileMutation.isPending}
              >
                Complete Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}