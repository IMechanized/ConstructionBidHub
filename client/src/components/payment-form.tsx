/**
 * Payment Form Component
 * 
 * Handles payment processing for featuring RFPs using Stripe Elements
 */

import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  stripePromise, 
  Elements, 
  createPaymentIntent, 
  confirmPayment, 
  formatPrice, 
  getStripeConfig,
  stripeConfigError
} from '@/lib/stripe';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Component for the actual Stripe payment form
function StripeCheckoutForm({ 
  rfpId, 
  pendingRfpData, 
  onSuccess, 
  onCancel 
}: { 
  rfpId?: number;
  pendingRfpData?: any;
  onSuccess: (rfp: any) => void;
  onCancel: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  // Handle form submission and payment processing
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements || !rfpId) {
      setErrorMessage("Payment system not ready yet. Please try again.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Confirm the payment with Stripe
      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.origin,
        },
      });

      if (paymentError) {
        setErrorMessage(paymentError.message || "An error occurred during payment");
        setIsLoading(false);
        return;
      }

      // Get PaymentIntent ID from elements
      const { paymentIntent } = await stripe.retrievePaymentIntent(
        elements.getElement(PaymentElement)?.dataset?.clientSecret || ''
      );

      if (!paymentIntent) {
        throw new Error("Could not retrieve payment information");
      }

      // Verify payment with our backend
      const result = await confirmPayment(paymentIntent.id, rfpId);
      
      if (result.success) {
        toast({
          title: 'Payment Successful',
          description: 'Your RFP has been featured and will appear in the featured listings.',
        });
        onSuccess(result.rfp);
      } else {
        throw new Error("Payment was processed but RFP update failed");
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-h-full overflow-y-auto">
      <div className="max-h-[300px] overflow-y-auto px-2">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="mt-3 text-red-500 text-sm">{errorMessage}</div>
      )}
      
      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        
        <Button 
          type="submit" 
          disabled={!stripe || isLoading}
        >
          {isLoading ? (
            <>
              <Loader size="sm" className="mr-2" />
              Processing...
            </>
          ) : (
            'Pay & Feature'
          )}
        </Button>
      </div>
    </form>
  );
}

// Main payment form container component
export default function PaymentForm({ 
  rfpId,
  pendingRfpData,
  price,
  onSuccess,
  onCancel,
}: {
  rfpId?: number;
  pendingRfpData?: any;
  price?: number;
  onSuccess: (rfp: any) => void;
  onCancel: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [createdRfpId, setCreatedRfpId] = useState<number | null>(null);
  const [displayPrice, setPrice] = useState<number>(price || 0);
  const { toast } = useToast();

  // Mutation to create RFP if needed
  const createRfpMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/rfps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to create RFP (${response.status})`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setCreatedRfpId(data.id);
    },
    onError: (error: Error) => {
      toast({
        title: 'RFP Creation Failed',
        description: error.message || 'Could not create RFP. Please try again.',
        variant: 'destructive',
      });
      onCancel();
    }
  });

  // Mutation to create a payment intent
  const createPaymentIntentMutation = useMutation({
    mutationFn: async (rfpId: number) => {
      return createPaymentIntent(rfpId);
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setPrice(data.amount);
    },
    onError: (error: Error) => {
      toast({
        title: 'Payment Setup Failed',
        description: error.message || 'Could not initialize payment. Please try again.',
        variant: 'destructive',
      });
      onCancel();
    }
  });

  useEffect(() => {
    // If we have a direct rfpId, use it to create a payment intent
    if (rfpId) {
      createPaymentIntentMutation.mutate(rfpId);
    } 
    // Otherwise, if we have pending data and no created rfpId yet, create the RFP first
    else if (pendingRfpData && !createdRfpId) {
      createRfpMutation.mutate(pendingRfpData);
    }
  }, [rfpId, pendingRfpData, createdRfpId]);

  // If we've created an RFP, create a payment intent for it
  useEffect(() => {
    if (createdRfpId) {
      createPaymentIntentMutation.mutate(createdRfpId);
    }
  }, [createdRfpId]);

  // Loading state
  if (!clientSecret || createPaymentIntentMutation.isPending) {
    return (
      <Card className="p-8 flex justify-center items-center">
        <Loader size="lg" />
      </Card>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  // Determine if we have payment provider configuration issues
  const hasStripeError = !stripePromise || stripeConfigError;

  return (
    <div className="max-w-md mx-auto mb-8">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2">Feature Your RFP</h2>
            <Badge variant="outline" className="mb-2">
              {formatPrice(displayPrice)} for 30 Days
            </Badge>
            <p className="text-sm text-muted-foreground text-center px-4">
              Featuring your RFP increases visibility by placing it in the featured section,
              resulting in more contractor views and higher-quality bids.
            </p>
          </div>

          {/* Set the created RFP ID to global window object so it can be accessed by the StripeCheckoutForm */}
          {createdRfpId && <script dangerouslySetInnerHTML={{ __html: `window.createdRfpId = ${createdRfpId};` }} />}
          
          {hasStripeError ? (
            <div className="p-6 text-center">
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  Stripe payment integration is not properly configured. Please contact the administrator.
                </AlertDescription>
              </Alert>
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          ) : (
            <Elements stripe={stripePromise} options={options}>
              <StripeCheckoutForm 
                rfpId={rfpId || createdRfpId || undefined} 
                pendingRfpData={pendingRfpData} 
                onSuccess={onSuccess} 
                onCancel={onCancel} 
              />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}