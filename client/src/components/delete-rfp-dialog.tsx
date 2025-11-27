import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Rfp, type RfpDocument, type Rfi } from "@shared/schema";
import { useLocation } from "wouter";
import { AlertTriangle, FileText, MessageSquare, TrendingUp, Database } from "lucide-react";

interface DeleteRfpDialogProps {
  rfp: Rfp;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteRfpDialog({ rfp, isOpen, onOpenChange }: DeleteRfpDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [confirmationText, setConfirmationText] = useState("");

  // Fetch documents count
  const { data: documents = [] } = useQuery<RfpDocument[]>({
    queryKey: [`/api/rfps/${rfp.id}/documents`],
    enabled: isOpen,
  });

  // Fetch RFIs count
  const { data: rfis = [] } = useQuery<Rfi[]>({
    queryKey: [`/api/rfps/${rfp.id}/rfi`],
    enabled: isOpen,
  });

  // Reset confirmation text when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmationText("");
    }
  }, [isOpen]);

  const isConfirmationValid = confirmationText === "DELETE";

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
      
      // Backend returns 200 with no body, so don't try to parse JSON
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfps"] });
      queryClient.invalidateQueries({ queryKey: [`/api/rfps/${rfp.id}`] });
      toast({
        title: "Success",
        description: "RFP deleted successfully",
      });
      // Redirect to dashboard first, then close dialog
      setLocation("/dashboard");
      onOpenChange(false);
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
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete RFP - Permanent Action
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {/* Main warning */}
            <div className="p-4 bg-destructive/10 border-2 border-destructive rounded-lg">
              <p className="text-foreground font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                This action cannot be undone!
              </p>
              <p className="text-sm text-muted-foreground">
                You are about to permanently delete "<strong className="text-foreground">{rfp.title}</strong>". 
                All associated data will be lost forever.
              </p>
            </div>

            {/* Boosted RFP warning */}
            {rfp.featured && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 border-2 border-orange-500 dark:border-orange-600 rounded-lg">
                <p className="text-orange-800 dark:text-orange-200 font-semibold text-sm flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Featured RFP - Non-Refundable
                </p>
                <p className="text-orange-700 dark:text-orange-300 text-sm">
                  This is a boosted RFP. The boosting fee is <strong>non-refundable</strong> if you delete this RFP.
                </p>
              </div>
            )}

            {/* Data summary */}
            <div className="p-3 bg-muted/50 rounded-lg border border-muted">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" />
                What will be deleted:
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  <span>
                    <strong className="text-foreground">{documents.length}</strong> document{documents.length !== 1 ? 's' : ''}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>
                    <strong className="text-foreground">{rfis.length}</strong> bid request{rfis.length !== 1 ? 's' : ''}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>All analytics and view data</span>
                </li>
              </ul>
            </div>

            {/* Confirmation input */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirmation-input" className="text-sm font-semibold">
                Type <code className="px-1.5 py-0.5 bg-muted rounded text-destructive font-mono">DELETE</code> to confirm:
              </Label>
              <Input
                id="confirmation-input"
                data-testid="input-delete-confirmation"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type DELETE here"
                className={`font-mono ${
                  confirmationText && !isConfirmationValid 
                    ? "border-destructive focus-visible:ring-destructive" 
                    : ""
                }`}
                disabled={deleteRfpMutation.isPending}
                autoComplete="off"
              />
              {confirmationText && !isConfirmationValid && (
                <p className="text-xs text-destructive">
                  Please type DELETE exactly as shown
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={deleteRfpMutation.isPending}
            data-testid="button-cancel-delete"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRfpMutation.isPending || !isConfirmationValid}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteRfpMutation.isPending ? "Deleting..." : "Delete RFP Forever"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}