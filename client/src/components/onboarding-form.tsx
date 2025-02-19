import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { contractorOnboardingSchema, governmentOnboardingSchema } from "@shared/schema";
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

const TRADE_OPTIONS = [
  "General Contractor",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Carpentry",
  "Masonry",
  "Painting",
  "Roofing",
  "Flooring",
  "Landscaping",
  "Concrete",
  "Steel/Metal Work",
  "Glass/Glazing",
  "Insulation",
  "Drywall",
  "Other",
];

const MINORITY_GROUPS = [
  "African American",
  "Hispanic American",
  "Asian Pacific American",
  "Native American",
  "Subcontinent Asian American",
  "Other",
];

const REVENUE_RANGES = [
  "Less than $1M",
  "$1M - $5M",
  "$5M - $10M",
  "$10M - $50M",
  "More than $50M",
];

const JURISDICTION_OPTIONS = [
  "Federal",
  "State/Provincial",
  "Municipal",
  "Regional",
  "Other",
];

export default function OnboardingForm({ userType }: { userType: "contractor" | "government" }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.onboardingComplete) {
      navigate(`/dashboard/${userType}`);
    }
  }, [user, userType, navigate]);

  const form = useForm({
    resolver: zodResolver(
      userType === "contractor" ? contractorOnboardingSchema : governmentOnboardingSchema
    ),
    defaultValues:
      userType === "contractor"
        ? {
            trade: "",
            yearlyRevenue: "",
            contact: "",
            telephone: "",
            cell: "",
            email: "",
            isMinorityOwned: false,
            minorityGroup: "",
          }
        : {
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
          navigate(`/dashboard/${userType}`);
        })
        .catch((error) => {
          console.error("Error refetching user data:", error);
          navigate(`/dashboard/${userType}`);
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
              {userType === "contractor" ? (
                <>
                  <FormField
                    control={form.control}
                    name="trade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trade</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your trade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TRADE_OPTIONS.map((option) => (
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Business Email" type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="yearlyRevenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yearly Revenue</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select revenue range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REVENUE_RANGES.map((range) => (
                              <SelectItem key={range} value={range}>
                                {range}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                              {MINORITY_GROUPS.map((group) => (
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
                </>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
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
                        <FormLabel>Jurisdiction</FormLabel>
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
                            {JURISDICTION_OPTIONS.map((option) => (
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
                </>
              )}
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