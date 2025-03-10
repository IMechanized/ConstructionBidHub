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
 * - Boost option for featured RFPs
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
import { useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertRfpSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface RfpFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RfpForm({ onSuccess, onCancel }: RfpFormProps) {
  const { toast } = useToast();

  // Initialize form with validation schema and default values
  const form = useForm({
    resolver: zodResolver(
      insertRfpSchema.extend({
        title: insertRfpSchema.shape.title.min(1, "Title is required"),
        description: insertRfpSchema.shape.description.min(1, "Description is required"),
        jobLocation: insertRfpSchema.shape.jobLocation.min(1, "Job location is required"),
        walkthroughDate: insertRfpSchema.shape.walkthroughDate.min(1, "Walkthrough date is required"),
        rfiDate: insertRfpSchema.shape.rfiDate.min(1, "RFI date is required"),
        deadline: insertRfpSchema.shape.deadline.min(1, "Deadline is required"),
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
      };
      const res = await apiRequest("POST", "/api/rfps", formattedData);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate cache and reset form
      queryClient.invalidateQueries({ queryKey: ["/api/rfps"] });
      form.reset();
      toast({
        title: "RFP Created",
        description: "Your RFP has been successfully created",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = async (data: any) => {
    createRfpMutation.mutate(data);
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
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input 
                  data-testid="title-input"
                  placeholder="Enter RFP title"
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  data-testid="description-input"
                  placeholder="Enter RFP description"
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
                <FormLabel>Walkthrough Date</FormLabel>
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
                <FormLabel>RFI Date</FormLabel>
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
              <FormLabel>Deadline</FormLabel>
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
              <FormLabel>Minimum Budget</FormLabel>
              <FormControl>
                <Input
                  data-testid="budget-input"
                  type="number"
                  placeholder="Enter minimum budget"
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
              <FormLabel>Job Location</FormLabel>
              <FormControl>
                <Input 
                  data-testid="location-input"
                  placeholder="Enter job location"
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
              <FormLabel>Certification Goals (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  data-testid="certification-input"
                  placeholder="Enter any certification requirements or goals..."
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
              <FormLabel>Portfolio Link (Optional)</FormLabel>
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
            Cancel
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
                Creating...
              </>
            ) : (
              "Submit RFP"
            )}
          </Button>
          <Button
            type="button"
            onClick={() => form.handleSubmit((data) => onSubmit({ ...data, featured: true }))()}
            disabled={createRfpMutation.isPending}
            data-testid="boost-button"
          >
            {createRfpMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Boosting...
              </>
            ) : (
              "Boost for Visibility"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}