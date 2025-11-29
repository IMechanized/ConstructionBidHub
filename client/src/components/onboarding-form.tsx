import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { onboardingSchema, CERTIFICATIONS, TRADE_OPTIONS } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { Upload, Loader2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { uploadImage } from "@/lib/upload";
import { getCertificationClasses } from "@/lib/utils";

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

type FormValues = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  telephone: string;
  cell: string;
  trade: string;
  certificationName: string[];
  logo: File | string | null;
};

export default function OnboardingForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.onboardingComplete) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      jobTitle: "",
      telephone: "",
      cell: "",
      trade: "",
      certificationName: [],
      logo: null,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Submitting form data:", data);
      const res = await apiRequest("POST", "/api/user/onboarding", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      console.log("Profile update successful:", data);
      try {
        await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated",
        });
        setTimeout(() => navigate("/dashboard"), 500);
      } catch (error) {
        console.error("Error after profile update:", error);
        toast({
          title: "Warning",
          description: "Profile updated but there was an error refreshing the data. Redirecting...",
          variant: "destructive",
        });
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    },
    onError: (error: Error) => {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    form.reset();
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (data: FormValues) => {
    console.log("Form submission started with data:", data);
    try {
      let logoUrl = data.logo;
      if (data.logo instanceof File) {
        setIsUploading(true);
        setUploadProgress(0);
        console.log("Uploading logo file...");
        logoUrl = await uploadImage(data.logo, (progress) => {
          setUploadProgress(progress.percentage);
        });
        console.log("Logo uploaded successfully:", logoUrl);
      }

      const formData = {
        ...data,
        logo: logoUrl,
      };

      console.log("Submitting form with processed data:", formData);
      updateProfileMutation.mutate(formData);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process form submission",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-6">Complete Your Profile</h2>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
              encType="multipart/form-data"
            >
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
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="First Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Last Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Project Manager, Site Supervisor, etc." />
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

              <FormField
                control={form.control}
                name="cell"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cell Phone</FormLabel>
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

              <FormField
                control={form.control}
                name="certificationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certifications</FormLabel>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {field.value.map((cert, index) => (
                          <div 
                            key={index} 
                            className={`px-3 py-1 rounded-full flex items-center gap-1 ${getCertificationClasses(cert, false)}`}
                          >
                            <span>{cert}</span>
                            <X 
                              className="h-4 w-4 cursor-pointer" 
                              onClick={() => {
                                const newValue = [...field.value];
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
                            const filteredValue = field.value.filter(cert => cert !== "None");
                            if (!filteredValue.includes(value)) {
                              field.onChange([...filteredValue, value]);
                            }
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select certifications" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CERTIFICATIONS.filter(cert => !field.value.includes(cert)).map((cert) => (
                            <SelectItem key={cert} value={cert}>
                              {cert}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Select one or more certifications that apply to your business.</p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Company Logo</FormLabel>
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
                                <span>Uploading...</span>
                              </div>
                            ) : logoPreview ? (
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="max-h-32 object-contain"
                              />
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

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateProfileMutation.isPending || isUploading}
                >
                  {updateProfileMutation.isPending || isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isUploading ? `Uploading... (${uploadProgress}%)` : "Saving..."}
                    </>
                  ) : (
                    "Complete Profile"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={updateProfileMutation.isPending || isUploading}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}