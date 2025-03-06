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
  const form = useForm({
    resolver: zodResolver(insertRfpSchema),
    defaultValues: {
      title: "",
      description: "",
      walkthroughDate: new Date().toISOString().split('T')[0],
      rfiDate: new Date().toISOString().split('T')[0],
      deadline: new Date().toISOString().split('T')[0],
      budgetMin: undefined,
      certificationGoals: "",
      jobLocation: "",
      portfolioLink: "",
      featured: false,
    },
  });

  const createRfpMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Submitting RFP data:', data);
      const formattedData = {
        ...data,
        budgetMin: data.budgetMin ? Number(data.budgetMin) : null,
      };
      console.log('Formatted RFP data:', formattedData);
      const res = await apiRequest("POST", "/api/rfps", formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfps"] });
      form.reset();
      toast({
        title: "RFP Created",
        description: "Your RFP has been successfully created",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('RFP creation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (featured: boolean) => {
    const values = form.getValues();
    const data = {
      ...values,
      portfolioLink: values.portfolioLink || null,
      certificationGoals: values.certificationGoals || null,
      budgetMin: values.budgetMin ? Number(values.budgetMin) : null,
      featured
    };

    // Validate form before submission
    const result = insertRfpSchema.safeParse(data);
    if (!result.success) {
      console.error('Validation errors:', result.error.issues);
      result.error.issues.forEach(issue => {
        toast({
          title: "Validation Error",
          description: `${issue.path}: ${issue.message}`,
          variant: "destructive"
        });
      });
      return;
    }

    console.log('Submitting validated data:', data);
    createRfpMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form 
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(false);
        }}
        data-testid="rfp-form"
      >
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
            onClick={() => handleSubmit(true)}
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