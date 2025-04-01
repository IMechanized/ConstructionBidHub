/**
 * RFP Form Component
 * 
 * A form component for creating and editing Request for Proposals (RFPs).
 * Handles form validation, submission, and error display using react-hook-form and zod.
 * 
 * Features:
 * - Required field validation
 * - Date field formatting
 * - Optional fields (budget, certifications, portfolio)
 * - Boost option for featured RFPs with Stripe payment integration
 * 
 * @component
 * @example
 * ```tsx
 * <RfpForm 
 *   onSuccess={() => console.log('RFP created')}
 *   onCancel={() => console.log('Form cancelled')}
 * />
 * ```
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertRfpSchema } from "@shared/schema";
import { Loader2, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import PaymentDialog from "./payment-dialog";
import { getFeaturedRfpPrice, formatPrice } from "@/lib/stripe";

interface RfpFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RfpForm({ onSuccess, onCancel }: RfpFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [createdRfpId, setCreatedRfpId] = useState<number | null>(null);
  
  // Fetch the featured RFP price
  const { data: featuredPrice = 2500, isLoading: isPriceLoading } = useQuery({
    queryKey: ['/api/payments/price'],
    queryFn: getFeaturedRfpPrice,
  });

  // Set language from user preference
  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);

  // Initialize form with validation schema and default values
  const form = useForm({
    resolver: zodResolver(
      insertRfpSchema.extend({
        title: insertRfpSchema.shape.title.min(1, t('validation.titleRequired')),
        description: insertRfpSchema.shape.description.min(1, t('validation.descriptionRequired')),
        jobLocation: insertRfpSchema.shape.jobLocation.min(1, t('validation.jobLocationRequired')),
        walkthroughDate: insertRfpSchema.shape.walkthroughDate.min(1, t('validation.walkthroughDateRequired')),
        rfiDate: insertRfpSchema.shape.rfiDate.min(1, t('validation.rfiDateRequired')),
        deadline: insertRfpSchema.shape.deadline.min(1, t('validation.deadlineRequired')),
      })
    ),
    defaultValues: {
      title: "",
      description: "",
      walkthroughDate: "",
      rfiDate: "",
      deadline: "",
      budgetMin: undefined,
      certificationGoals: "",
      jobLocation: "",
      portfolioLink: "",
      featured: false,
    },
  });

  // Mutation for creating new RFP
  const createRfpMutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        ...data,
        budgetMin: data.budgetMin ? Number(data.budgetMin) : null,
        portfolioLink: data.portfolioLink || null,
        certificationGoals: data.certificationGoals || null,
        // Always set featured to false - we'll update it after payment
        featured: false
      };
      const res = await apiRequest("POST", "/api/rfps", formattedData);
      return res.json();
    },
    onSuccess: (newRfp) => {
      setCreatedRfpId(newRfp.id);
      
      // If user clicked the boost button, show payment dialog
      const wantsFeatured = form.getValues().featured;
      if (wantsFeatured) {
        setShowPaymentDialog(true);
      } else {
        // Otherwise handle normal success flow
        finishSubmission();
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle completion after successful submission
  const finishSubmission = () => {
    // Invalidate cache and reset form
    queryClient.invalidateQueries({ queryKey: ["/api/rfps"] });
    form.reset();
    setCreatedRfpId(null);
    toast({
      title: t('rfp.rfpCreated'),
      description: t('rfp.rfpCreatedSuccess'),
    });
    onSuccess?.();
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    toast({
      title: t('payment.success'),
      description: t('rfp.featuredSuccess'),
    });
    finishSubmission();
  };

  // Form submission handler
  const onSubmit = async (data: any) => {
    // If user is requesting to feature the RFP (from button click)
    if (data.featured) {
      // First validate the form
      const isValid = await form.trigger();
      if (!isValid) return;
      
      // Submit the form values without featured flag first
      const formValues = form.getValues();
      createRfpMutation.mutate({
        ...formValues,
        featured: false // Initially create as non-featured
      });
    } else {
      // Regular submission
      createRfpMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form 
        className="space-y-6"
        onSubmit={form.handleSubmit(onSubmit)}
        data-testid="rfp-form"
      >
        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rfp.title')}</FormLabel>
              <FormControl>
                <Input 
                  data-testid="title-input"
                  placeholder={t('rfp.enterTitle')}
                  {...field} 
                />
              </FormControl>
              <FormMessage role="alert" data-testid="title-error" />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rfp.description')}</FormLabel>
              <FormControl>
                <Textarea 
                  data-testid="description-input"
                  placeholder={t('rfp.enterDescription')}
                  {...field} 
                />
              </FormControl>
              <FormMessage role="alert" data-testid="description-error" />
            </FormItem>
          )}
        />

        {/* Date Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="walkthroughDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('rfp.walkthroughDate')}</FormLabel>
                <FormControl>
                  <Input 
                    data-testid="walkthrough-date-input"
                    type="datetime-local"
                    {...field}
                  />
                </FormControl>
                <FormMessage role="alert" data-testid="walkthrough-date-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rfiDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('rfp.rfiDate')}</FormLabel>
                <FormControl>
                  <Input 
                    data-testid="rfi-date-input"
                    type="datetime-local"
                    {...field}
                  />
                </FormControl>
                <FormMessage role="alert" data-testid="rfi-date-error" />
              </FormItem>
            )}
          />
        </div>

        {/* Deadline Field */}
        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rfp.deadline')}</FormLabel>
              <FormControl>
                <Input 
                  data-testid="deadline-input"
                  type="datetime-local"
                  {...field}
                />
              </FormControl>
              <FormMessage role="alert" data-testid="deadline-error" />
            </FormItem>
          )}
        />

        {/* Budget Field */}
        <FormField
          control={form.control}
          name="budgetMin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rfp.minimumBudget')}</FormLabel>
              <FormControl>
                <Input
                  data-testid="budget-input"
                  type="number"
                  placeholder={t('rfp.enterMinimumBudget')}
                  {...field}
                  onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage role="alert" data-testid="budget-error" />
            </FormItem>
          )}
        />

        {/* Location Field */}
        <FormField
          control={form.control}
          name="jobLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rfp.jobLocation')}</FormLabel>
              <FormControl>
                <Input 
                  data-testid="location-input"
                  placeholder={t('rfp.enterJobLocation')}
                  {...field}
                />
              </FormControl>
              <FormMessage role="alert" data-testid="location-error" />
            </FormItem>
          )}
        />

        {/* Certification Goals Field */}
        <FormField
          control={form.control}
          name="certificationGoals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rfp.certificationGoals')}</FormLabel>
              <FormControl>
                <Textarea 
                  data-testid="certification-input"
                  placeholder={t('rfp.enterCertificationGoals')}
                  {...field}
                />
              </FormControl>
              <FormMessage role="alert" data-testid="certification-error" />
            </FormItem>
          )}
        />

        {/* Portfolio Link Field */}
        <FormField
          control={form.control}
          name="portfolioLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rfp.portfolioLink')}</FormLabel>
              <FormControl>
                <Input 
                  data-testid="portfolio-input"
                  type="url"
                  placeholder="https://..."
                  {...field}
                />
              </FormControl>
              <FormMessage role="alert" data-testid="portfolio-error" />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              onCancel?.();
            }}
            data-testid="cancel-button"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="outline"
            disabled={createRfpMutation.isPending}
            data-testid="submit-button"
          >
            {createRfpMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('rfp.creating')}
              </>
            ) : (
              t('rfp.submitRfp')
            )}
          </Button>
          <Button
            type="button"
            onClick={() => form.handleSubmit((data) => onSubmit({ ...data, featured: true }))()}
            disabled={createRfpMutation.isPending || isPriceLoading}
            data-testid="boost-button"
          >
            {createRfpMutation.isPending || isPriceLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('rfp.boosting')}
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {t('rfp.boostVisibility')} {formatPrice(featuredPrice)}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        rfpId={createdRfpId || undefined}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Form>
  );
}