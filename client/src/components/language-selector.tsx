import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Globe } from "lucide-react";

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

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || "en");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.language) {
      setSelectedLanguage(user.language);
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);

  const handleLanguageChange = async (value: string) => {
    setSelectedLanguage(value);
    i18n.changeLanguage(value);
    
    try {
      await apiRequest("POST", "/api/user/settings", { language: value });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: t('settings.languageUpdated'),
        description: t('settings.languageUpdateSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.languageUpdateError'),
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6 bg-card border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('settings.language')}
        </CardTitle>
        <CardDescription>
          {t('settings.languageDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={selectedLanguage}
          onValueChange={handleLanguageChange}
        >
          <SelectTrigger className="w-full md:w-[280px] bg-background">
            <SelectValue placeholder={t('settings.selectLanguage')} />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}