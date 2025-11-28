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
import { Upload, Loader2, Trash2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { uploadImage } from "@/lib/upload";
import { useTranslation } from "react-i18next";
import { CERTIFICATIONS } from "@shared/schema";
import { getCertificationClasses } from "@/lib/utils";

// Available options for form select fields - Updated to match registration form
const TRADE_OPTIONS = [
  "Owner",
  "Construction Manager",
  "General Contractor",
  "Division 02 — Site Works",
  "Division 03 — Concrete",
  "Division 04 — Masonry",
  "Division 05 — Metals",
  "Division 06 — Wood and Plastics",
  "Division 07 — Thermal and Moisture Protection",
  "Division 08 — Doors and Windows",
  "Division 09 — Finishes",
  "Division 10 — Specialties",
  "Division 11 — Equipment",
  "Division 12 — Furnishings",
  "Division 13 — Special Construction",
  "Division 14 — Conveying Systems",
  "Division 15 — Mechanical/Plumbing",
  "Division 16 — Electrical",
];

// Phone number formatting utility
const formatPhoneNumber = (value: string) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

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

// Settings form validation schema - Updated to match onboarding schema
const settingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  telephone: z.string().min(1, "Telephone is required"),
  cell: z.string().min(1, "Cell phone is required"),
  trade: z.string().min(1, "Trade is required"),
  certificationName: z.array(z.string()).optional(),
  logo: z.any().optional(),
  language: z.string().default("en"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsForm() {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.logo || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();

  // Set initial language from user preference
  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);

  // Initialize form with user data
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: user?.companyName || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      jobTitle: user?.jobTitle || "",
      telephone: user?.telephone || "",
      cell: user?.cell || "",
      trade: user?.trade || "",
      certificationName: Array.isArray(user?.certificationName) ? user.certificationName : [],
      logo: user?.logo || undefined,
      language: user?.language || "en",
    },
  });

  // Update user settings mutation
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

  // Handle logo file upload with enhanced validation
  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // File size validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Logo file size must be less than 5MB. Please compress your image or choose a different file.",
          variant: "destructive",
        });
        return;
      }

      // File type validation
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PNG, JPG, or SVG file for best results.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('logo', file);
      
      toast({
        title: "Logo Uploaded",
        description: "Your logo has been uploaded successfully. Preview it below in different sizes.",
      });
    }
  };

  // Handle logo removal
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    form.setValue('logo', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form submission handler
  const onSubmit = async (data: SettingsFormValues) => {
    try {
      let logoUrl = data.logo;
      if (data.logo instanceof File) {
        setIsUploading(true);
        setUploadProgress(0);
        logoUrl = await uploadImage(data.logo, (progress) => {
          setUploadProgress(progress.percentage);
        });
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
      setUploadProgress(0);
    }
  };

  // Account deactivation mutation
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

  // Account deletion mutation
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

  // Render the settings form
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">{t('settings.organizationSettings')}</h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
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

            {/* Language Selection Field - with explicit styling */}
            <FormField 
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="w-full mb-4 border-2 border-primary p-4 rounded-md">
                  <FormLabel className="text-lg font-bold">{t('settings.language') || 'Language'}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 bg-background">
                        <SelectValue placeholder={t('settings.selectLanguage') || 'Select Language'} />
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

            {/* Trade Field */}
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

            {/* First Name Field */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Name Field */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Title Field */}
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Project Manager, Site Supervisor, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Telephone Field with US formatting */}
            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.telephone')}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="(555) 123-4567" 
                      type="tel"
                      onChange={(e) => {
                        const formattedValue = formatPhoneNumber(e.target.value);
                        field.onChange(formattedValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cell Phone Field with US formatting */}
            <FormField
              control={form.control}
              name="cell"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.cellPhone')}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="(555) 123-4567" 
                      type="tel"
                      onChange={(e) => {
                        const formattedValue = formatPhoneNumber(e.target.value);
                        field.onChange(formattedValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Certifications Field */}
            <FormField
              control={form.control}
              name="certificationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.certificationName') || 'Certifications'}</FormLabel>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(field.value || []).map((cert, index) => (
                        <div 
                          key={index} 
                          className={`px-3 py-1 rounded-full flex items-center gap-1 ${getCertificationClasses(cert, false)}`}
                        >
                          <span>{cert}</span>
                          <X 
                            className="h-4 w-4 cursor-pointer" 
                            onClick={() => {
                              const newValue = [...(field.value || [])];
                              newValue.splice(index, 1);
                              field.onChange(newValue);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <Select
                      onValueChange={(value) => {
                        if (value === "None") {
                          field.onChange(["None"]);
                        } else {
                          const currentValue = field.value || [];
                          const filteredValue = currentValue.filter(cert => cert !== "None");
                          if (!filteredValue.includes(value)) {
                            field.onChange([...filteredValue, value]);
                          }
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.selectCertification') || 'Select certification'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CERTIFICATIONS.filter(cert => !(field.value || []).includes(cert)).map((cert) => (
                          <SelectItem key={cert} value={cert}>
                            {cert}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Logo Field with Enhanced Guidelines */}
            <FormField
              control={form.control}
              name="logo"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>{t('settings.companyLogo')}</FormLabel>
                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded-lg p-4 text-sm">
                      <h4 className="font-medium mb-2">Logo Guidelines:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• <strong>Format:</strong> PNG recommended (for transparency), JPG, or SVG</li>
                        <li>• <strong>Size:</strong> Minimum 200×200px, maximum 1000×1000px</li>
                        <li>• <strong>File Size:</strong> Under 5MB</li>
                        <li>• <strong>Design:</strong> Clean, professional, readable at small sizes</li>
                        <li>• <strong>Background:</strong> Transparent or white background works best</li>
                      </ul>
                    </div>
                    
                    <FormControl>
                      <div className="flex flex-col gap-4">
                        <label
                          htmlFor="logo-upload"
                          className="cursor-pointer flex items-center justify-center w-full border-2 border-dashed rounded-lg p-8 hover:border-primary transition-colors bg-background"
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
                              <span className="font-medium">Click to upload your company logo</span>
                              <span className="text-xs">or drag and drop your file here</span>
                            </div>
                          )}
                          <input
                            id="logo-upload"
                            type="file"
                            ref={fileInputRef}
                            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                            className="hidden"
                            onChange={handleLogoChange}
                            disabled={isUploading}
                          />
                        </label>
                        
                        {logoPreview && (
                          <div className="bg-muted/30 rounded-lg p-4">
                            <h4 className="font-medium mb-3">Preview at Different Sizes:</h4>
                            <div className="grid grid-cols-3 gap-4 items-center">
                              <div className="text-center">
                                <div className="bg-white border rounded p-2 mb-2 flex items-center justify-center h-16">
                                  <img src={logoPreview} alt="Large preview" className="max-h-12 max-w-full object-contain" />
                                </div>
                                <span className="text-xs text-muted-foreground">Large (Profile)</span>
                              </div>
                              <div className="text-center">
                                <div className="bg-white border rounded p-1 mb-2 flex items-center justify-center h-10">
                                  <img src={logoPreview} alt="Medium preview" className="max-h-6 max-w-full object-contain" />
                                </div>
                                <span className="text-xs text-muted-foreground">Medium (Directory)</span>
                              </div>
                              <div className="text-center">
                                <div className="bg-white border rounded p-1 mb-2 flex items-center justify-center h-8">
                                  <img src={logoPreview} alt="Small preview" className="max-h-4 max-w-full object-contain" />
                                </div>
                                <span className="text-xs text-muted-foreground">Small (Lists)</span>
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground">
                              ✓ Your logo looks good at all sizes. Make sure text and details are clear in the smallest preview.
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload Progress Indicator */}
            {isUploading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading logo...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={updateSettingsMutation.isPending || isUploading}
            >
              {updateSettingsMutation.isPending || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? `${t('common.uploading')} (${uploadProgress}%)` : t('common.loading')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Danger Zone Section */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-destructive mb-4">{t('settings.dangerZone')}</h2>
        <div className="space-y-4">
          {/* Deactivate Account Dialog */}
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

          {/* Delete Account Dialog */}
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