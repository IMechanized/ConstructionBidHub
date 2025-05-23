import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Rfp } from "@shared/schema";
import { useLocation } from "wouter";

interface DeleteRfpDialogProps {
  rfp: Rfp;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteRfpDialog({ rfp, isOpen, onOpenChange }: DeleteRfpDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const deleteRfpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/rfps/${rfp.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete RFP");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfps"] });
      queryClient.invalidateQueries({ queryKey: [`/api/rfps/${rfp.id}`] });
      toast({
        title: "Success",
        description: "RFP deleted successfully",
      });
      // Close the dialog first, then redirect to dashboard
      onOpenChange(false);
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete RFP",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteRfpMutation.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete RFP</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete "<strong>{rfp.title}</strong>"? 
              This action cannot be undone.
            </p>
            {rfp.featured && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md">
                <p className="text-orange-800 dark:text-orange-200 font-medium text-sm">
                  ⚠️ <strong>Important:</strong> This is a boosted RFP. The boosting fee is non-refundable 
                  if you choose to delete this RFP.
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              All associated bid requests and analytics data will also be permanently deleted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRfpMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRfpMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRfpMutation.isPending ? "Deleting..." : "Delete RFP"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}