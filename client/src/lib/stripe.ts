/**
 * Client-side Stripe utilities
 */
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Get available publishable keys
const LIVE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_LIVE_PUBLISHABLE_KEY;
const TEST_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY;
const GENERIC_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Determine which mode to use based on available keys
const hasLiveKey = Boolean(LIVE_PUBLISHABLE_KEY);
const hasTestKey = Boolean(TEST_PUBLISHABLE_KEY);
const hasGenericKey = Boolean(GENERIC_PUBLISHABLE_KEY);
const isProduction = import.meta.env.MODE === 'production';

// Determine the appropriate mode based on available keys
let mode: 'live' | 'test' = 'test'; // Default to test mode

// If running in production and live key is available, use live mode
if (isProduction && hasLiveKey) {
  mode = 'live';
// If running in development and test key is available, use test mode
} else if (!isProduction && hasTestKey) {
  mode = 'test';
// If only one specific type of key is available, use that mode
} else if (hasLiveKey && !hasTestKey) {
  mode = 'live';
} else if (!hasLiveKey && hasTestKey) {
  mode = 'test';
}

// Select the appropriate key based on mode and availability
let STRIPE_PUBLISHABLE_KEY: string | undefined;
if (mode === 'live') {
  STRIPE_PUBLISHABLE_KEY = LIVE_PUBLISHABLE_KEY;
} else {
  // In test mode, prefer the explicit test key, but fall back to generic key if needed
  STRIPE_PUBLISHABLE_KEY = TEST_PUBLISHABLE_KEY || GENERIC_PUBLISHABLE_KEY;
}

// Determine if the selected key matches the intended mode
const keyType = STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live') ? 'live' : 'test';

// Determine if the selected key matches the intended mode
const keyMatchesMode = mode === keyType;

// Log configuration
console.log('Stripe client mode:', mode);
console.log('Stripe key available:', Boolean(STRIPE_PUBLISHABLE_KEY));
console.log('Key type:', keyType);

// Warn if key type doesn't match intended mode
if (!keyMatchesMode && STRIPE_PUBLISHABLE_KEY) {
  console.warn(`Warning: Stripe key type (${keyType}) doesn't match intended mode (${mode})`);
}

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