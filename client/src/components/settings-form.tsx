import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useTranslation } from "react-i18next";

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

const settingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contact: z.string().min(1, "Contact name is required"),
  telephone: z.string().min(1, "Telephone is required"),
  cell: z.string().min(1, "Cell phone is required"),
  businessEmail: z.string().email("Invalid email address"),
  trade: z.string().min(1, "Trade is required"),
  isMinorityOwned: z.boolean(),
  minorityGroup: z.string().optional(),
  certificationName: z.string().optional(),
  logo: z.any().optional(),
  language: z.string().default("en"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsForm() {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.logo || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();

  // Set initial language from user preference
  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: user?.companyName || "",
      contact: user?.contact || "",
      telephone: user?.telephone || "",
      cell: user?.cell || "",
      businessEmail: user?.businessEmail || "",
      trade: user?.trade || "",
      isMinorityOwned: user?.isMinorityOwned || false,
      minorityGroup: user?.minorityGroup || "",
      certificationName: user?.certificationName || "",
      logo: user?.logo || undefined,
      language: user?.language || "en",
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      const res = await apiRequest("POST", "/api/user/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Settings Updated",
        description: "Your organization settings have been updated successfully",
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

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('logo', file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    form.setValue('logo', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      let logoUrl = data.logo;
      if (data.logo instanceof File) {
        setIsUploading(true);
        logoUrl = await uploadToCloudinary(data.logo);
      }

      const formData = {
        ...data,
        logo: logoUrl,
      };

      updateSettingsMutation.mutate(formData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deactivateAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/deactivate", {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deactivated",
        description: "Your account has been deactivated. You will be logged out.",
      });
      logoutMutation.mutate();
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/user", {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted. You will be logged out.",
      });
      logoutMutation.mutate();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('settings.organizationSettings')}</h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.companyName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField 
              control={form.control}
              name="trade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.trade')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('settings.selectTrade')} />
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
                  <FormLabel>{t('settings.contactName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>{t('settings.telephone')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" />
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
                  <FormLabel>{t('settings.cellPhone')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" />
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
                  <FormLabel>{t('settings.businessEmail')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="certificationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.certificationName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('settings.certificationPlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>{t('settings.companyLogo')}</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center gap-4">
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer flex items-center justify-center w-full border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors"
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span>{t('common.uploading')}</span>
                          </div>
                        ) : logoPreview ? (
                          <div className="relative">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="max-h-32 object-contain"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2"
                              onClick={(e) => {
                                e.preventDefault();
                                handleRemoveLogo();
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="h-8 w-8" />
                            <span>{t('settings.uploadLogo')}</span>
                          </div>
                        )}
                        <input
                          id="logo-upload"
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoChange}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.language')}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      i18n.changeLanguage(value);
                    }}
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
                      {t('settings.minorityOwned')}
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
                    <FormLabel>{t('settings.minorityGroup')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.selectMinorityGroup')} />
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

            <Button
              type="submit"
              className="w-full"
              disabled={updateSettingsMutation.isPending || isUploading}
            >
              {updateSettingsMutation.isPending || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? t('common.uploading') : t('common.loading')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-destructive mb-4">{t('settings.dangerZone')}</h2>
        <div className="space-y-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                {t('settings.deactivateAccount')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('settings.areYouSure')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('settings.deactivateWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deactivateAccountMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('settings.deactivateAccount')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                {t('settings.deleteAccount')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('settings.areYouAbsolutelySure')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('settings.deleteWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAccountMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('settings.deleteAccount')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}