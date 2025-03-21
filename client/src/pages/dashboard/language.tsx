import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";

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

export default function LanguagePage() {
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  
  const breadcrumbItems = [
    {
      label: t('dashboard.dashboard'),
      href: "/dashboard",
    },
    {
      label: t('sidebar.settings'),
      href: "/dashboard/settings",
    },
    {
      label: "Language Settings",
      href: "/dashboard/language",
    }
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
        description: "Your language preference has been updated successfully.",
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

  // Handle language change and save immediately
  const handleLanguageSelect = (value: string) => {
    setSelectedLanguage(value);
    updateLanguageMutation.mutate(value);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />
            <h1 className="text-3xl font-bold mb-8">Language Settings</h1>
            
            <Card className="p-8 max-w-lg mx-auto border-4 border-primary">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Select Your Preferred Language</h2>
                  <p className="text-muted-foreground mb-6">
                    Choose the language you prefer for the application interface.
                    Your selection will be saved and applied immediately.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Click on a language to select it:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {LANGUAGES.map((lang) => {
                      const isActive = selectedLanguage === lang.value;
                      return (
                        <Button
                          key={lang.value}
                          variant={isActive ? "default" : "outline"}
                          size="lg"
                          className={`h-16 text-lg justify-between ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => handleLanguageSelect(lang.value)}
                          disabled={updateLanguageMutation.isPending}
                        >
                          <span>{lang.label}</span>
                          {isActive && <Check className="h-5 w-5 ml-2" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {updateLanguageMutation.isPending && (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-lg">Saving language preference...</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}