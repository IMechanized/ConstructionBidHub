/**
 * Payment Form Component
 * 
 * Handles payment processing for featuring RFPs using Stripe Elements
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Loader } from './ui/loader';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { stripePromise, Elements, createPaymentIntent, confirmPayment, formatPrice, getStripeConfig } from '@/lib/stripe';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { queryClient } from '@/lib/queryClient';

interface PaymentFormProps {
  rfpId?: number;
  pendingRfpData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

function StripeCheckoutForm({ rfpId, pendingRfpData, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ paymentIntentId, rfpId }: { paymentIntentId: string, rfpId: number }) => {
      try {
        // Check authentication status before attempting payment confirmation
        const authResponse = await fetch('/api/auth-status', {
          credentials: 'include' // Include cookies for session authentication
        });
        
        if (!authResponse.ok) {
          throw new Error('Could not verify authentication status');
        }
        
        const authStatus = await authResponse.json();
        
        if (!authStatus.isAuthenticated) {
          console.error('Authentication check failed before payment confirmation', authStatus);
          throw new Error('Your session has expired. Please refresh the page and try again.');
        }
        
        // Proceed with payment confirmation
        return confirmPayment(paymentIntentId, rfpId);
      } catch (error) {
        console.error('Error during payment confirmation process:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the RFPs query cache to refresh all views with the newly featured RFP
      queryClient.invalidateQueries({ queryKey: ["/api/rfps"] });
      
      toast({
        title: 'Payment Successful',
        description: 'Your RFP has been featured successfully!',
        variant: 'default',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      setIsLoading(false);
      
      // Check if it's an authentication error
      const isAuthError = error.message?.includes('401') || 
                          error.message?.includes('session') ||
                          error.message?.includes('expired');
      
      toast({
        title: 'Payment Confirmation Failed',
        description: isAuthError 
          ? 'Your session may have expired. Please refresh the page and try again.'
          : error.message || 'Failed to confirm payment. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get the actual RFP ID (either directly provided or created during payment setup)
    const actualRfpId = rfpId || (window as any).createdRfpId;
    
    if (!stripe || !elements || !actualRfpId) {
      setErrorMessage('Payment cannot be processed. Missing required information.');
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
        rfpId: actualRfpId 
      });
    } else {
      setErrorMessage('Payment status is pending or requires additional action');
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

export default function PaymentForm({ rfpId, pendingRfpData, onSuccess, onCancel }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [createdRfpId, setCreatedRfpId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Get Stripe configuration to show initialization status
  const { data: stripeConfig, isError: stripeConfigError } = useQuery({ 
    queryKey: ['stripe-config'],
    queryFn: getStripeConfig,
    // Don't retry too many times if the API is failing
    retry: 1
  });
  
  // If we have pendingRfpData but no rfpId, we need to create the RFP first
  const createRfpMutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        ...data,
        budgetMin: data.budgetMin ? Number(data.budgetMin) : null,
        portfolioLink: data.portfolioLink || null,
        certificationGoals: data.certificationGoals || null,
        featured: false // Initially create as non-featured
      };
      const res = await fetch("/api/rfps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create RFP");
      }
      
      return res.json();
    },
    onSuccess: (newRfp) => {
      setCreatedRfpId(newRfp.id);
      // Now that we have the RFP ID, create a payment intent
      createPaymentIntentMutation.mutate(newRfp.id);
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

  if (!clientSecret || createPaymentIntentMutation.isPending) {
    return (
      <Card className="p-8 flex justify-center items-center">
        <Loader size="lg" />
      </Card>
    );
  }

  // Type assertion to avoid type errors with Stripe's API
  const options = {
    clientSecret: clientSecret || '',  // Ensure it's never null, but we'll handle empty string case
    appearance: {
      theme: 'stripe' as const,
    },
  };
  
  // Don't render Stripe Elements if client secret is empty or invalid
  const isValidClientSecret = clientSecret && clientSecret.includes('_secret_');

  // Determine if we have payment provider configuration issues
  const hasStripeError = !stripePromise || stripeConfigError;

  return (
    <div>
      {stripeConfig && (
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Payment System</span>
            <Badge variant="secondary">
              Ready
            </Badge>
          </div>
          
          {!stripeConfig.isInitialized && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription className="text-xs">
                Payment system is not fully configured. This is only a preview of the payment flow.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
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
          {/* Set the created RFP ID to global window object so it can be accessed by the StripeCheckoutForm */}
          {createdRfpId && <script dangerouslySetInnerHTML={{ __html: `window.createdRfpId = ${createdRfpId};` }} />}
          
          {hasStripeError || !isValidClientSecret ? (
            <div className="p-6 text-center">
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {!isValidClientSecret 
                    ? "Could not initialize payment session. Please try again or contact support."
                    : "Stripe payment integration is not properly configured. Please contact the administrator."}
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