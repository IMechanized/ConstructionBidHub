/**
 * Client-side Stripe utilities
 */
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Get Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  console.error('No Stripe publishable key provided. Please add VITE_STRIPE_PUBLISHABLE_KEY to your environment variables.');
}

// Log configuration
console.log('Stripe key available:', Boolean(STRIPE_PUBLISHABLE_KEY));

// Create Stripe instance with error handling
// Use proper typing for the Stripe promise
const stripePromise = STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(STRIPE_PUBLISHABLE_KEY) 
  : null;

// Get the payment amount for featuring an RFP
export async function getFeaturedRfpPrice(): Promise<number> {
  try {
    const response = await fetch('/api/payments/price', {
      credentials: 'include', // Include cookies for session authentication
    });
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
}> {
  try {
    const response = await fetch('/api/payments/config', {
      credentials: 'include', // Include cookies for session authentication
    });
    if (!response.ok) {
      throw new Error('Failed to fetch Stripe configuration');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching Stripe configuration:', error);
    return { 
      isInitialized: false
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
export async function createPaymentIntent(rfpId: number): Promise<{clientSecret: string, amount: number, isMock?: boolean}> {
  const response = await fetch('/api/payments/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rfpId }),
    credentials: 'include', // Include cookies for session authentication
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Create payment intent error:', response.status, error);
    throw new Error(error.message || `Failed to create payment intent (${response.status})`);
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
    credentials: 'include', // Include cookies for session authentication
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Confirm payment error:', response.status, error);
    throw new Error(error.message || `Failed to confirm payment (${response.status})`);
  }
  
  return response.json();
}

export { stripePromise, Elements };