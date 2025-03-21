import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

// Available language options
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "ru", label: "Русский" },
  { value: "ar", label: "العربية" },
];

// Simple schema for organization settings
const settingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  language: z.string().default("en"),
  email: z.string().email("Invalid email address"),
  isActive: z.boolean().default(true),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  const breadcrumbItems = [
    {
      label: t('dashboard.dashboard'),
      href: "/dashboard",
    },
    {
      label: t('sidebar.settings'),
      href: "/dashboard/settings",
    },
  ];

  // Initialize form with user data
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: user?.companyName || "",
      language: user?.language || "en",
      email: user?.email || "",
      isActive: true,
    },
  });

  // Update user settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      setIsSaving(true);
      const res = await apiRequest("POST", "/api/user/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Settings Updated",
        description: "Your organization settings have been updated successfully",
      });
      if (form.getValues("language") !== i18n.language) {
        i18n.changeLanguage(form.getValues("language"));
      }
      setIsSaving(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />
            <h1 className="text-3xl font-bold mb-8">{t('settings.organizationSettings')}</h1>
            
            {/* Simple Settings Form */}
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Basic Settings</h2>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => updateSettingsMutation.mutate(data))}
                  className="space-y-4"
                >
                  {/* Company Name Field */}
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.companyName')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Your company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Language Selection Field */}
                  <FormField 
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.language')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('settings.selectLanguage')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LANGUAGES.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.businessEmail')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="company@example.com" 
                            type="email" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Active Status Field */}
                  <FormField
                    control={form.control}
                    name="isActive"
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
                            Active Account
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Settings"}
                  </Button>
                </form>
              </Form>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}