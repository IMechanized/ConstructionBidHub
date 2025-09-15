import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertRfpSchema, type Rfp } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { US_STATES_AND_TERRITORIES } from "@/lib/utils";

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
  const queryClient = useQueryClient();

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

  const updateRfpMutation = useMutation({
    mutationFn: async (data: any) => {
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
    },
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

  const onSubmit = (data: any) => {
    updateRfpMutation.mutate(data);
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
          <Label htmlFor="budgetMin">Budget (USD)</Label>
          <Input
            id="budgetMin"
            type="number"
            {...form.register("budgetMin", { valueAsNumber: true })}
            placeholder="Enter minimum budget"
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

        <div>
          <Label htmlFor="certificationGoals">Certification Requirements (Optional)</Label>
          <Textarea
            id="certificationGoals"
            {...form.register("certificationGoals")}
            placeholder="Describe any certification requirements"
            rows={3}
          />
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
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={updateRfpMutation.isPending}>
          {updateRfpMutation.isPending ? "Updating..." : "Update RFP"}
        </Button>
      </div>
    </form>
  );
}