/**
 * Payment Form Component
 * 
 * Handles payment processing for featuring RFPs using Stripe Elements
 */

import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Loader } from './ui/loader';
import { stripePromise, Elements, createPaymentIntent, confirmPayment, formatPrice } from '@/lib/stripe';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentFormProps {
  rfpId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function StripeCheckoutForm({ rfpId, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ paymentIntentId, rfpId }: { paymentIntentId: string, rfpId: number }) => {
      return confirmPayment(paymentIntentId, rfpId);
    },
    onSuccess: () => {
      toast({
        title: 'Payment Successful',
        description: 'Your RFP has been featured successfully!',
        variant: 'default',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      setIsLoading(false);
      toast({
        title: 'Payment Confirmation Failed',
        description: error.message || 'Failed to confirm payment. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !rfpId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An unknown error occurred');
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment successful, now update the RFP status
      confirmPaymentMutation.mutate({ 
        paymentIntentId: paymentIntent.id, 
        rfpId 
      });
    } else {
      setErrorMessage('Payment status is pending or requires additional action');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      
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

export default function PaymentForm({ rfpId, onSuccess, onCancel }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [price, setPrice] = useState<number>(0);
  const { toast } = useToast();

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
    if (rfpId) {
      createPaymentIntentMutation.mutate(rfpId);
    }
  }, [rfpId]);

  if (!clientSecret || createPaymentIntentMutation.isPending) {
    return (
      <Card className="p-8 flex justify-center items-center">
        <Loader size="lg" />
      </Card>
    );
  }

  // Type assertion to avoid type errors with Stripe's API
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Featured RFP listing:</span>
          <span className="font-bold">{formatPrice(price)}</span>
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          Your RFP will be featured for 30 days, after which it will return to normal listing status.
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <Elements stripe={stripePromise} options={options}>
            <StripeCheckoutForm rfpId={rfpId} onSuccess={onSuccess} onCancel={onCancel} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}