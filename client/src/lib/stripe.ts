/**
 * Client-side Stripe utilities
 */
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Determine environment
const isProduction = import.meta.env.MODE === 'production';

// Initialize Stripe with appropriate publishable key based on mode
// If environment-specific keys aren't available, fall back to the generic key
const STRIPE_PUBLISHABLE_KEY = isProduction
  ? import.meta.env.VITE_STRIPE_LIVE_PUBLISHABLE_KEY
  : import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY;

console.log('Stripe mode:', isProduction ? 'live' : 'test');
console.log('Stripe key available:', Boolean(STRIPE_PUBLISHABLE_KEY));

// Create Stripe instance with error handling
const stripePromise = STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(STRIPE_PUBLISHABLE_KEY) 
  : Promise.reject(new Error('Stripe publishable key is not available. Please check your environment variables.'));

// Get the payment amount for featuring an RFP
export async function getFeaturedRfpPrice(): Promise<number> {
  try {
    const response = await fetch('/api/payments/price');
    const data = await response.json();
    return data.price;
  } catch (error) {
    console.error('Error fetching featured RFP price:', error);
    return 2500; // Default to $25.00 if API fails
  }
}

// Get Stripe configuration information
export async function getStripeConfig(): Promise<{ 
  isInitialized: boolean; 
  mode: 'live' | 'test'; 
  keyType: 'live' | 'test' | null;
}> {
  try {
    const response = await fetch('/api/payments/config');
    if (!response.ok) {
      throw new Error('Failed to fetch Stripe configuration');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching Stripe configuration:', error);
    return { 
      isInitialized: false, 
      mode: 'test', 
      keyType: null 
    };
  }
}

// Format price from cents to dollars with currency symbol
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

// Create a payment intent
export async function createPaymentIntent(rfpId: number): Promise<{clientSecret: string, amount: number}> {
  const response = await fetch('/api/payments/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rfpId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create payment intent');
  }
  
  return response.json();
}

// Confirm successful payment and update RFP status
export async function confirmPayment(paymentIntentId: string, rfpId: number): Promise<{success: boolean, rfp: any}> {
  const response = await fetch('/api/payments/confirm-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentIntentId, rfpId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to confirm payment');
  }
  
  return response.json();
}

export { stripePromise, Elements };