import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import SettingsForm from "@/components/settings-form";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

export default function SettingsPage() {
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(user?.language || "en");
  
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

  // Update language when user data loads
  useEffect(() => {
    if (user?.language) {
      setSelectedLanguage(user.language);
    }
  }, [user?.language]);

  // Language update mutation
  const updateLanguageMutation = useMutation({
    mutationFn: async (language: string) => {
      const res = await apiRequest("POST", "/api/user/settings", { language });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Language Updated",
        description: "Your language preference has been updated.",
      });
      i18n.changeLanguage(selectedLanguage);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle language change
  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  // Handle language save
  const handleLanguageSave = () => {
    updateLanguageMutation.mutate(selectedLanguage);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />
            <h1 className="text-3xl font-bold mb-8">{t('settings.organizationSettings')}</h1>
            
            {/* Standalone Language Selection */}
            <Card className="p-6 mb-6 border-2 border-primary">
              <h2 className="text-xl font-semibold mb-4">Language Preferences</h2>
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="language-select" className="text-base">
                    Select Language
                  </Label>
                  <Select 
                    value={selectedLanguage} 
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger id="language-select" className="w-full">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleLanguageSave}
                  disabled={updateLanguageMutation.isPending}
                  className="w-full"
                >
                  {updateLanguageMutation.isPending ? "Saving..." : "Save Language Preference"}
                </Button>
              </div>
            </Card>
            
            {/* Organization settings form with all fields */}
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <SettingsForm />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}