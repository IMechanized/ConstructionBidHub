/**
 * Payment Dialog Component
 * 
 * A modal dialog that contains the payment form for featuring RFPs
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import PaymentForm from "./payment-form";
import { useTranslation } from "react-i18next";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rfpId?: number;
  onPaymentSuccess: () => void;
}

export default function PaymentDialog({
  isOpen,
  onClose,
  rfpId,
  onPaymentSuccess,
}: PaymentDialogProps) {
  const { t } = useTranslation();

  const handleSuccess = () => {
    // Invalidate RFP queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["/api/rfps"] });
    if (rfpId) {
      queryClient.invalidateQueries({ queryKey: ["/api/rfps", rfpId.toString()] });
    }
    
    onPaymentSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('payment.featureYourRfp')}</DialogTitle>
          <DialogDescription>
            {t('payment.featureDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PaymentForm
            rfpId={rfpId}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}