/**
 * Payment Form Component
 * 
 * Handles payment processing for featuring RFPs using Stripe Elements
 */

import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import stripePromise from '@/lib/stripe';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';

interface PaymentFormProps {
  rfpId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

// The inner payment form component that uses the Stripe hooks
function StripeCheckoutForm({ rfpId, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm the payment with Stripe
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin, // Used only for redirect-based payments
        },
        redirect: 'if_required', // Only redirect if required by the payment method
      });

      if (submitError) {
        setError(submitError.message || 'An error occurred with your payment');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.id && paymentIntent.status === 'succeeded') {
        // Now confirm the payment with our server and update the RFP
        const response = await apiRequest('POST', '/api/payments/confirm', {
          paymentIntentId: paymentIntentId || paymentIntent.id,
          rfpId,
        });

        if (response.ok) {
          toast({
            title: t('payment.success'),
            description: t('payment.rfpFeatured'),
          });
          onSuccess();
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update RFP status');
        }
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while processing payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t('payment.paymentError')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PaymentElement />

      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || !elements || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader className="mr-2 h-4 w-4" />
              {t('payment.processing')}
            </>
          ) : (
            t('payment.payNow')
          )}
        </Button>
      </div>
    </form>
  );
}

// Wrapper component that creates the payment intent and renders Stripe Elements
export default function PaymentForm({ rfpId, onSuccess, onCancel }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    // Create a payment intent when the component mounts
    const createIntent = async () => {
      try {
        const response = await apiRequest('POST', '/api/payments/create-intent', { rfpId });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create payment intent');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: t('payment.error'),
          description: err instanceof Error ? err.message : t('payment.intentError'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    createIntent();
  }, [rfpId, toast, t]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('payment.preparing')}</CardTitle>
          <CardDescription>{t('payment.preparingDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('payment.error')}</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onCancel}>{t('common.goBack')}</Button>
        </CardFooter>
      </Card>
    );
  }

  // Only render Stripe Elements once we have a client secret
  if (!clientSecret) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('payment.featuredRfpPayment')}</CardTitle>
        <CardDescription>{t('payment.featuredRfpDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Elements 
          stripe={stripePromise} 
          options={{ clientSecret }}
        >
          <StripeCheckoutForm 
            rfpId={rfpId} 
            onSuccess={onSuccess} 
            onCancel={onCancel} 
          />
        </Elements>
      </CardContent>
    </Card>
  );
}