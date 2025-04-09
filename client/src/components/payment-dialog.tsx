/**
 * Payment Dialog Component
 * 
 * A modal dialog that contains the payment form for featuring RFPs
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import PaymentForm from './payment-form';
import { ScrollArea } from './ui/scroll-area';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rfpId?: number;
  onPaymentSuccess: () => void;
  // If pendingRfpData is provided, we'll create the RFP first then show payment
  pendingRfpData?: any;
}

export default function PaymentDialog({
  isOpen,
  onClose,
  rfpId,
  onPaymentSuccess,
  pendingRfpData,
}: PaymentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Feature Your RFP</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="py-4">
            <p className="mb-4">
              Featuring your RFP will increase its visibility by:
            </p>
            
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>Displaying it at the top of all search results</li>
              <li>Adding a "Featured" badge for more attention</li>
              <li>Including it in promotional emails to contractors</li>
              <li>Receiving priority in mobile notifications</li>
            </ul>
            
            <PaymentForm
              rfpId={rfpId}
              pendingRfpData={pendingRfpData}
              onSuccess={onPaymentSuccess}
              onCancel={onClose}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}