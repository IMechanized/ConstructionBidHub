import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertRfpSchema, type Rfp, CERTIFICATIONS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { US_STATES_AND_TERRITORIES, getCertificationClasses } from "@/lib/utils";
import { X, Zap, Loader2 } from "lucide-react";
import PaymentDialog from "./payment-dialog";
import { getFeaturedRfpPrice, formatPrice } from "@/lib/stripe";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";

const editRfpSchema = insertRfpSchema.extend({
  walkthroughDate: insertRfpSchema.shape.walkthroughDate.transform((date) => {
    if (typeof date === 'string') return date;
    return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
  }),
  rfiDate: insertRfpSchema.shape.rfiDate.transform((date) => {
    if (typeof date === 'string') return date;
    return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
  }),
  deadline: insertRfpSchema.shape.deadline.transform((date) => {
    if (typeof date === 'string') return date;
    return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
  }),
});

interface EditRfpFormProps {
  rfp: Rfp;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditRfpForm({ rfp, onSuccess, onCancel }: EditRfpFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  
  // Fetch the featured RFP price
  const { data: featuredPrice = 2500, isLoading: isPriceLoading } = useQuery({
    queryKey: ['/api/payments/price'],
    queryFn: getFeaturedRfpPrice,
  });

  const form = useForm({
    resolver: zodResolver(editRfpSchema),
    defaultValues: {
      title: rfp.title,
      description: rfp.description,
      jobStreet: rfp.jobStreet,
      jobCity: rfp.jobCity,
      jobState: rfp.jobState,
      jobZip: rfp.jobZip,
      budgetMin: rfp.budgetMin || undefined,
      walkthroughDate: format(new Date(rfp.walkthroughDate), "yyyy-MM-dd'T'HH:mm"),
      rfiDate: format(new Date(rfp.rfiDate), "yyyy-MM-dd'T'HH:mm"),
      deadline: format(new Date(rfp.deadline), "yyyy-MM-dd'T'HH:mm"),
      certificationGoals: rfp.certificationGoals || [],
      portfolioLink: rfp.portfolioLink || "",
    },
  });

  // Common mutation function for updating RFP
  const updateRfpMutationFn = async (data: any) => {
    // Convert date strings to Date objects for the API
    // Ensure dates are valid Date objects before sending to API
    const processedData = {
      ...data,
      walkthroughDate: data.walkthroughDate ? new Date(data.walkthroughDate) : null,
      rfiDate: data.rfiDate ? new Date(data.rfiDate) : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
    };

    // Validate that dates were converted successfully
    if (!processedData.walkthroughDate || !processedData.rfiDate || !processedData.deadline) {
      throw new Error("Invalid date format");
    }

    const response = await fetch(`/api/rfps/${rfp.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(processedData),
      credentials: "include",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update RFP");
    }
    
    return response.json();
  };

  // Main update mutation (with onSuccess side effects)
  const updateRfpMutation = useMutation({
    mutationFn: updateRfpMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rfps/${rfp.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/rfps"] });
      toast({
        title: "Success",
        description: "RFP updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update RFP",
        variant: "destructive",
      });
    },
  });

  // Silent update mutation (no onSuccess side effects, for pre-boost saves)
  const silentUpdateRfpMutation = useMutation({
    mutationFn: updateRfpMutationFn,
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update RFP",
        variant: "destructive",
      });
    },
  });

  // Handle payment success
  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setIsBoosting(false);
    toast({
      title: "Payment Successful",
      description: "Your RFP has been boosted for better visibility!",
    });
    queryClient.invalidateQueries({ queryKey: [`/api/rfps/${rfp.id}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/rfps"] });
    onSuccess();
  };

  const onSubmit = (data: any) => {
    updateRfpMutation.mutate(data);
  };

  const handleBoost = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to boost your RFP",
        variant: "destructive",
      });
      return;
    }
    
    // First validate the form
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Form Validation Error",
        description: "Please fix the form errors before boosting",
        variant: "destructive",
      });
      return;
    }
    
    setIsBoosting(true);
    
    // If form has unsaved changes, save them first
    if (form.formState.isDirty) {
      try {
        // Save the form data first using the silent mutation (won't close form)
        const formData = form.getValues();
        await silentUpdateRfpMutation.mutateAsync(formData);
        
        // Now proceed with boost
        setShowPaymentDialog(true);
      } catch (error) {
        setIsBoosting(false);
        toast({
          title: "Error",
          description: "Failed to save changes before boosting. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // No unsaved changes, proceed directly to boost
      setShowPaymentDialog(true);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Project Title</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="Enter project title"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Project Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Describe the project in detail"
            rows={4}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        {/* Job Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Job Address</h3>
          
          {/* Street Address */}
          <div>
            <Label htmlFor="jobStreet">Street Address</Label>
            <Input
              id="jobStreet"
              {...form.register("jobStreet")}
              placeholder="Enter street address"
            />
            {form.formState.errors.jobStreet && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.jobStreet.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* City */}
            <div>
              <Label htmlFor="jobCity">City</Label>
              <Input
                id="jobCity"
                {...form.register("jobCity")}
                placeholder="Enter city"
              />
              {form.formState.errors.jobCity && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.jobCity.message}
                </p>
              )}
            </div>

            {/* State */}
            <div>
              <Label htmlFor="jobState">State</Label>
              <select
                id="jobState"
                {...form.register("jobState")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select state</option>
                {US_STATES_AND_TERRITORIES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {form.formState.errors.jobState && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.jobState.message}
                </p>
              )}
            </div>

            {/* ZIP Code */}
            <div>
              <Label htmlFor="jobZip">ZIP Code</Label>
              <Input
                id="jobZip"
                {...form.register("jobZip")}
                placeholder="Enter ZIP code"
              />
              {form.formState.errors.jobZip && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.jobZip.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="budgetMin">Budget estimate</Label>
          <Input
            id="budgetMin"
            type="number"
            {...form.register("budgetMin", { valueAsNumber: true })}
            placeholder="Enter budget estimate"
          />
          {form.formState.errors.budgetMin && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.budgetMin.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="walkthroughDate">Site Walkthrough Date</Label>
          <Input
            id="walkthroughDate"
            type="datetime-local"
            {...form.register("walkthroughDate")}
          />
          {form.formState.errors.walkthroughDate && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.walkthroughDate.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="rfiDate">RFI Submission Deadline</Label>
          <Input
            id="rfiDate"
            type="datetime-local"
            {...form.register("rfiDate")}
          />
          {form.formState.errors.rfiDate && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.rfiDate.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="deadline">Proposal Due Date</Label>
          <Input
            id="deadline"
            type="datetime-local"
            {...form.register("deadline")}
          />
          {form.formState.errors.deadline && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.deadline.message}
            </p>
          )}
        </div>

        {/* Certification Goals Field */}
        <div>
          <Label>Certification Requirements (Optional)</Label>
          <div className="space-y-3">
            {/* Display selected certifications */}
            <div className="flex flex-wrap gap-2 mb-2">
              {form.watch("certificationGoals")?.map((cert, index) => (
                <div 
                  key={index} 
                  className={`px-3 py-1 rounded-full flex items-center gap-1 ${getCertificationClasses(cert, false)}`}
                >
                  <span>{cert}</span>
                  <X 
                    className="h-4 w-4 cursor-pointer" 
                    onClick={() => {
                      const currentValue = form.getValues("certificationGoals") || [];
                      const newValue = [...currentValue];
                      newValue.splice(index, 1);
                      form.setValue("certificationGoals", newValue);
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Select dropdown for adding certifications */}
            <Select
              onValueChange={(value: string) => {
                const currentValue = form.getValues("certificationGoals") || [];
                if (!currentValue.includes(value)) {
                  form.setValue("certificationGoals", [...currentValue, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select certification requirements" />
              </SelectTrigger>
              <SelectContent>
                {CERTIFICATIONS.filter(cert => !(form.watch("certificationGoals") || []).includes(cert)).map((cert) => (
                  <SelectItem key={cert} value={cert}>
                    {cert}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Select multiple certifications that contractors should have</p>
          </div>
          {form.formState.errors.certificationGoals && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.certificationGoals.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="portfolioLink">Portfolio/Documents Link (Optional)</Label>
          <Input
            id="portfolioLink"
            type="url"
            {...form.register("portfolioLink")}
            placeholder="https://example.com/documents"
          />
          {form.formState.errors.portfolioLink && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.portfolioLink.message}
            </p>
          )}
        </div>

        {/* RFP Boosting Benefits Section - Only show if RFP is not featured */}
        {!rfp.featured && (
          <div 
            className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6 space-y-4" 
            data-testid="boost-benefits-section"
            role="region"
            aria-labelledby="boost-benefits-heading"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
              <h3 id="boost-benefits-heading" className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                {t('rfp.boost.heading')}
              </h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm list-none">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-600 dark:bg-yellow-400 rounded-full mt-2 flex-shrink-0" aria-hidden="true"></div>
                <div>
                  <strong className="text-yellow-800 dark:text-yellow-200">{t('rfp.boost.priorityVisibility.title')}</strong>
                  <p className="text-yellow-700 dark:text-yellow-300">{t('rfp.boost.priorityVisibility.description')}</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-600 dark:bg-yellow-400 rounded-full mt-2 flex-shrink-0" aria-hidden="true"></div>
                <div>
                  <strong className="text-yellow-800 dark:text-yellow-200">{t('rfp.boost.moreResponses.title')}</strong>
                  <p className="text-yellow-700 dark:text-yellow-300">{t('rfp.boost.moreResponses.description')}</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-600 dark:bg-yellow-400 rounded-full mt-2 flex-shrink-0" aria-hidden="true"></div>
                <div>
                  <strong className="text-yellow-800 dark:text-yellow-200">{t('rfp.boost.fasterMatching.title')}</strong>
                  <p className="text-yellow-700 dark:text-yellow-300">{t('rfp.boost.fasterMatching.description')}</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-600 dark:bg-yellow-400 rounded-full mt-2 flex-shrink-0" aria-hidden="true"></div>
                <div>
                  <strong className="text-yellow-800 dark:text-yellow-200">{t('rfp.boost.professionalBadge.title')}</strong>
                  <p className="text-yellow-700 dark:text-yellow-300">{t('rfp.boost.professionalBadge.description')}</p>
                </div>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        {/* Boost Button - Only show if RFP is not featured */}
        {!rfp.featured && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleBoost}
            disabled={isBoosting || isPriceLoading}
            data-testid="boost-button"
            className="w-full sm:w-auto"
          >
            {isBoosting || isPriceLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Boosting...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Boost for Visibility {formatPrice(featuredPrice)}</span>
              </>
            )}
          </Button>
        )}
        
        <Button type="submit" disabled={updateRfpMutation.isPending}>
          {updateRfpMutation.isPending ? "Updating..." : "Update RFP"}
        </Button>
      </div>
      
      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false);
          setIsBoosting(false);
        }}
        rfpId={rfp.id}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </form>
  );
}