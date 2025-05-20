/**
 * Client-side Stripe utilities
 * Handles integration with Stripe for payment processing
 */

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Get the publishable key from environment variables
const possibleKeys = [
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  import.meta.env.STRIPE_PUBLISHABLE_KEY
];
const STRIPE_PUBLISHABLE_KEY = possibleKeys.find(key => key && typeof key === 'string');

// Initialize Stripe with error handling
let stripePromise = null;
let stripeConfigError = false;

try {
  if (STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    console.log('✅ Stripe client initialized');
  } else if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    console.warn('⚠️ Using mock Stripe in development mode');
    // In development, we'll use a mock implementation if not properly configured
    stripePromise = Promise.resolve({ 
      elements: () => ({}),
      createPaymentMethod: () => Promise.resolve({}) 
    }) as any;
    stripeConfigError = true;
  } else {
    console.error('❌ No valid Stripe publishable key found');
    stripeConfigError = true;
  }
} catch (error) {
  console.error('❌ Error initializing Stripe:', error);
  stripeConfigError = true;
}

/**
 * Format a price from cents to a readable currency format
 * @param cents Price in cents
 * @returns Formatted price string
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Get the Stripe configuration status
 * @returns Configuration status object
 */
export async function getStripeConfig(): Promise<{ isInitialized: boolean }> {
  try {
    const response = await fetch('/api/payments/config', {
      credentials: 'include',
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    return { isInitialized: false };
  }
}

/**
 * Get the price for featuring an RFP
 * @returns Price in cents
 */
export async function getFeaturedRfpPrice(): Promise<number> {
  try {
    const response = await fetch('/api/payments/price', {
      credentials: 'include',
    });
    const data = await response.json();
    return data.price;
  } catch (error) {
    console.error('Error fetching featured RFP price:', error);
    return 2500; // Default to $25.00 if API fails
  }
}

/**
 * Create a payment intent for featuring an RFP
 * @param rfpId The ID of the RFP to feature
 * @returns The client secret and amount
 */
export async function createPaymentIntent(rfpId: number): Promise<{ clientSecret: string, amount: number }> {
  const response = await fetch('/api/payments/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rfpId }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to create payment intent (${response.status})`);
  }
  
  return await response.json();
}

/**
 * Confirm a successful payment and update RFP status
 * @param paymentIntentId The ID of the payment intent
 * @param rfpId The ID of the RFP
 * @returns Success status and updated RFP
 */
export async function confirmPayment(paymentIntentId: string, rfpId: number): Promise<{success: boolean, rfp: any}> {
  const response = await fetch('/api/payments/confirm-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentIntentId, rfpId }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to confirm payment (${response.status})`);
  }
  
  return await response.json();
}

/**
 * Get payment status
 * @param paymentIntentId The ID of the payment intent
 * @returns Payment status
 */
export async function getPaymentStatus(paymentIntentId: string, rfpId?: number): Promise<any> {
  const url = new URL(`/api/payments/status/${paymentIntentId}`, window.location.origin);
  if (rfpId) {
    url.searchParams.append('rfpId', String(rfpId));
  }
  
  const response = await fetch(url.toString(), {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to get payment status (${response.status})`);
  }
  
  return await response.json();
}

// Export Stripe-related objects and variables
export { 
  stripePromise, 
  Elements,
  stripeConfigError
};