/**
 * Client-side Stripe utilities
 */
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with publishable key 
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '');

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