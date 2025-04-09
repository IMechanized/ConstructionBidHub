import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { onboardingSchema, CERTIFICATIONS } from "@shared/schema";
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
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getCertificationClasses } from "@/lib/utils";

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

type FormValues = {
  contact: string;
  telephone: string;
  cell: string;
  businessEmail: string;
  isMinorityOwned: boolean;
  minorityGroup: string;
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
      contact: "",
      telephone: "",
      cell: "",
      businessEmail: "",
      isMinorityOwned: false,
      minorityGroup: "",
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
        console.log("Uploading logo file...");
        logoUrl = await uploadToCloudinary(data.logo);
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
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Logo file size must be less than 5MB",
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
                          if (!field.value.includes(value)) {
                            field.onChange([...field.value, value]);
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
                    <FormControl>
                      <div className="flex flex-col items-center gap-4">
                        <label
                          htmlFor="logo-upload"
                          className="cursor-pointer flex items-center justify-center w-full border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors"
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
                              <span>Click to upload logo</span>
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

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateProfileMutation.isPending || isUploading}
                >
                  {updateProfileMutation.isPending || isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isUploading ? "Uploading..." : "Saving..."}
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