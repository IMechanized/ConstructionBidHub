/**
 * Payment Dialog Component
 * 
 * A modal dialog that contains the payment form for featuring RFPs
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import PaymentForm from './payment-form';

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Feature Your RFP</DialogTitle>
        </DialogHeader>
        
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
            onSuccess={onPaymentSuccess}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}