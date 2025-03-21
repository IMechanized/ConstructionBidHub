import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useLocation } from "wouter";
import SettingsForm from "@/components/settings-form";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/language-selector";

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

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar currentPath={location} />

      <div className="flex-1 md:ml-[280px]">
        <main className="w-full min-h-screen pb-16 md:pb-0">
          <div className="container mx-auto p-4 md:p-8 mt-14 md:mt-0">
            <BreadcrumbNav items={breadcrumbItems} />
            <h1 className="text-3xl font-bold mb-8">{t('settings.organizationSettings')}</h1>
            
            {/* TEST ELEMENT - Should always be visible */}
            <div className="p-6 bg-destructive text-destructive-foreground mb-8 text-center text-xl font-bold">
              Language selector should appear here
            </div>
            
            {/* Simplified Language Selector */}
            <div className="mb-8 p-6 bg-card border shadow-sm rounded-lg">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('settings.language')}
              </h2>
              <p className="mb-4 text-muted-foreground">
                {t('settings.languageDescription')}
              </p>
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
            </div>
            
            {/* Organization settings form */}
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <SettingsForm />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}