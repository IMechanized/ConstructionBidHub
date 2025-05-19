/**
 * Client-side Stripe utilities
 */
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Check multiple possible environment variable names for Stripe publishable key
const possibleKeys = [
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  import.meta.env.VITE_STRIPE_PK,
  import.meta.env.VITE_PUBLISHABLE_KEY,
  import.meta.env.STRIPE_PUBLISHABLE_KEY, // Some environments pass without VITE_ prefix
  // We don't use placeholders - they would cause Stripe to throw errors
  undefined
];

// Find the first valid key
const STRIPE_PUBLISHABLE_KEY = possibleKeys.find(key => key && typeof key === 'string');

// Log configuration
console.log('Stripe client key found:', Boolean(STRIPE_PUBLISHABLE_KEY));

// Create Stripe instance with error handling
let stripePromise = null;
try {
  if (STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    console.log('Stripe client initialized');
  } else if (process.env.NODE_ENV !== 'production') {
    console.warn('Using mock Stripe in development mode');
    // In development, we'll create a mock implementation
    stripePromise = Promise.resolve({ 
      elements: () => ({}),
      createPaymentMethod: () => Promise.resolve({}) 
    }) as any;
  } else {
    console.error('No valid Stripe publishable key found for this environment');
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
}

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
  try {
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
    
    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    // In development mode, return a mock payment intent to allow testing
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock payment intent in development due to error');
      return {
        clientSecret: 'mock_client_secret_for_development',
        amount: 2500, // $25.00
        isMock: true
      };
    }
    
    throw error;
  }
}

// Confirm successful payment and update RFP status
export async function confirmPayment(paymentIntentId: string, rfpId: number): Promise<{success: boolean, rfp: any}> {
  try {
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
    
    return await response.json();
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
}

export { stripePromise, Elements };