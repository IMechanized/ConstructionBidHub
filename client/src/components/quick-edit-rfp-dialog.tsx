/**
 * Quick Edit RFP Dialog Component
 * 
 * A streamlined modal for making quick edits to RFP fields inline
 * without navigating to a separate page. Focuses on the most commonly
 * edited fields for better user experience.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type Rfp } from "@shared/schema";
import { Loader2, Edit3 } from "lucide-react";
import { format } from "date-fns";

// Quick edit schema - only the most commonly edited fields
const quickEditSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  jobLocation: z.string().min(1, "Location is required").max(200, "Location must be less than 200 characters"),
  budgetMin: z.number().min(0, "Budget must be positive").optional().nullable(),
  deadline: z.string().min(1, "Deadline is required"),
});

type QuickEditFormData = z.infer<typeof quickEditSchema>;

interface QuickEditRfpDialogProps {
  rfp: Rfp;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickEditRfpDialog({ rfp, isOpen, onOpenChange }: QuickEditRfpDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<QuickEditFormData>({
    resolver: zodResolver(quickEditSchema),
    defaultValues: {
      title: rfp.title,
      description: rfp.description,
      jobLocation: rfp.jobLocation,
      budgetMin: rfp.budgetMin || undefined,
      deadline: format(new Date(rfp.deadline), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  const updateRfpMutation = useMutation({
    mutationFn: async (data: QuickEditFormData) => {
      const processedData = {
        ...data,
        deadline: new Date(data.deadline),
      };

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
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update RFP",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuickEditFormData) => {
    updateRfpMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Quick Edit RFP
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the project requirements, scope, and details"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budgetMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (USD) - Optional</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50000"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposal Deadline</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={updateRfpMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateRfpMutation.isPending}
              >
                {updateRfpMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update RFP"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}