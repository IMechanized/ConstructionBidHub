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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertRfpSchema, CERTIFICATIONS } from "@shared/schema";
import { Loader2, Zap, X } from "lucide-react";
import { US_STATES_AND_TERRITORIES } from "@/lib/utils";
import { getCertificationClasses } from "@/lib/utils";
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
  const [pendingRfpData, setPendingRfpData] = useState<any>(null);
  const [isBoosting, setIsBoosting] = useState(false);
  
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
        jobStreet: insertRfpSchema.shape.jobStreet.min(1, t('validation.jobStreetRequired')),
        jobCity: insertRfpSchema.shape.jobCity.min(1, t('validation.jobCityRequired')),
        jobState: insertRfpSchema.shape.jobState.min(1, t('validation.jobStateRequired')),
        jobZip: insertRfpSchema.shape.jobZip.min(1, t('validation.jobZipRequired')),
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
      certificationGoals: [],
      jobStreet: "",
      jobCity: "",
      jobState: "",
      jobZip: "",
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
        certificationGoals: data.certificationGoals && data.certificationGoals.length > 0 ? data.certificationGoals : null,
        // Always set featured to false - we'll update it after payment if needed
        featured: false
      };
      const res = await apiRequest("POST", "/api/rfps", formattedData);
      return res.json();
    },
    onSuccess: (newRfp) => {
      setCreatedRfpId(newRfp.id);
      // For regular (non-boosted) RFPs, finish submission right away
      if (!isBoosting) {
        finishSubmission();
      }
    },
    onError: (error: Error) => {
      setIsBoosting(false);
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
    setPendingRfpData(null);
    setIsBoosting(false);
    toast({
      title: t('rfp.rfpCreated'),
      description: t('rfp.rfpCreatedSuccess'),
    });
    onSuccess?.();
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    toast({
      title: t('payment.success'),
      description: t('rfp.featuredSuccess'),
    });
    finishSubmission();
  };

  // Form submission handler
  const onSubmit = async (data: any) => {
    // If user is requesting to feature the RFP (from boost button click)
    if (data.featured) {
      // First validate the form
      const isValid = await form.trigger();
      if (!isValid) return;
      
      // Store form data temporarily but don't submit yet
      setIsBoosting(true);
      setPendingRfpData(form.getValues());
      
      // First show payment dialog
      setShowPaymentDialog(true);
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

        {/* Job Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('rfp.jobAddress')}</h3>
          
          {/* Street Address */}
          <FormField
            control={form.control}
            name="jobStreet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('rfp.streetAddress')}</FormLabel>
                <FormControl>
                  <Input 
                    data-testid="street-input"
                    placeholder={t('rfp.enterStreetAddress')}
                    {...field}
                  />
                </FormControl>
                <FormMessage role="alert" data-testid="street-error" />
              </FormItem>
            )}
          />

          {/* City and State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="jobCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('rfp.city')}</FormLabel>
                  <FormControl>
                    <Input 
                      data-testid="city-input"
                      placeholder={t('rfp.enterCity')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage role="alert" data-testid="city-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('rfp.state')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="state-select">
                        <SelectValue placeholder={t('rfp.selectState')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {US_STATES_AND_TERRITORIES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage role="alert" data-testid="state-error" />
                </FormItem>
              )}
            />
          </div>

          {/* ZIP Code */}
          <FormField
            control={form.control}
            name="jobZip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('rfp.zipCode')}</FormLabel>
                <FormControl>
                  <Input 
                    data-testid="zip-input"
                    placeholder={t('rfp.enterZipCode')}
                    {...field}
                  />
                </FormControl>
                <FormMessage role="alert" data-testid="zip-error" />
              </FormItem>
            )}
          />
        </div>

        {/* Certification Goals Field */}
        <FormField
          control={form.control}
          name="certificationGoals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('rfp.certificationGoals')}</FormLabel>
              <div className="space-y-3">
                {/* Display selected certifications */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {field.value?.map((cert, index) => (
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
                        data-testid={`remove-certification-${index}`}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Select dropdown for adding certifications */}
                <Select
                  onValueChange={(value: string) => {
                    const currentValue = field.value as string[] || [];
                    if (!currentValue.includes(value)) {
                      field.onChange([...currentValue, value]);
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger data-testid="certification-select">
                      <SelectValue placeholder={t('rfp.selectCertificationGoals')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CERTIFICATIONS.filter(cert => !(field.value as string[] || []).includes(cert)).map((cert) => (
                      <SelectItem key={cert} value={cert}>
                        {cert}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t('rfp.certificationGoalsDescription')}</p>
              </div>
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
                  type="text"
                  placeholder="www.example.com or https://example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage role="alert" data-testid="portfolio-error" />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              onCancel?.();
            }}
            data-testid="cancel-button"
            className="w-full sm:w-auto"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="outline"
            disabled={createRfpMutation.isPending}
            data-testid="submit-button"
            className="w-full sm:w-auto"
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
            onClick={() => {
              // Make sure user is authenticated before allowing payment flow
              if (!user) {
                toast({
                  title: t('common.error'),
                  description: t('auth.loginRequired'),
                  variant: "destructive",
                });
                return;
              }
              form.handleSubmit((data) => onSubmit({ ...data, featured: true }))()
            }}
            disabled={createRfpMutation.isPending || isPriceLoading}
            data-testid="boost-button"
            className="w-full sm:w-auto"
          >
            {createRfpMutation.isPending || isPriceLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('rfp.boosting')}
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">{t('rfp.boostVisibility')} {formatPrice(featuredPrice)}</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false);
          setIsBoosting(false);
        }}
        rfpId={createdRfpId || undefined}
        pendingRfpData={pendingRfpData}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Form>
  );
}