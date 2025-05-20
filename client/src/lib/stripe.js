/**
 * Client-side Stripe Integration
 * Provides utilities for Stripe payment processing on the frontend
 */

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Get Stripe publishable key from environment variables
const possibleKeys = [
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  import.meta.env.STRIPE_PUBLISHABLE_KEY
];

const STRIPE_PUBLISHABLE_KEY = possibleKeys.find(key => 
  key && typeof key === 'string' && key.startsWith('pk_')
);

// Initialize Stripe with error handling
let stripePromise = null;
let stripeConfigError = false;

try {
  if (STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    console.log('✅ Stripe client initialized');
  } else if (import.meta.env.DEV) {
    console.warn('⚠️ Using mock Stripe in development mode');
    // Mock implementation for development
    stripePromise = Promise.resolve({
      elements: () => ({}),
      createPaymentMethod: () => Promise.resolve({})
    });
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
 * @param {number} cents Price in cents
 * @returns {string} Formatted price string (e.g., "$25.00")
 */
export function formatPrice(cents) {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Get the Stripe configuration status from the server
 * @returns {Promise<Object>} Configuration status object
 */
export async function getStripeConfig() {
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
 * @returns {Promise<number>} Price in cents
 */
export async function getFeaturedRfpPrice() {
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
 * @param {number} rfpId The ID of the RFP to feature
 * @returns {Promise<Object>} Payment details including client secret
 */
export async function createPaymentIntent(rfpId) {
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
    throw new Error(error.message || `Payment failed (${response.status})`);
  }
  
  return await response.json();
}

/**
 * Confirm a payment was successful and update RFP status
 * @param {string} paymentIntentId The ID of the payment intent
 * @param {number} rfpId The ID of the RFP to feature
 * @returns {Promise<Object>} Success status and updated RFP
 */
export async function confirmPayment(paymentIntentId, rfpId) {
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
 * Get the status of a payment
 * @param {string} paymentIntentId The ID of the payment intent
 * @param {number} [rfpId] Optional RFP ID for additional context
 * @returns {Promise<Object>} Payment status details
 */
export async function getPaymentStatus(paymentIntentId, rfpId) {
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

/**
 * Cancel a pending payment
 * @param {string} paymentIntentId The ID of the payment intent to cancel
 * @returns {Promise<Object>} Success status and message
 */
export async function cancelPayment(paymentIntentId) {
  const response = await fetch('/api/payments/cancel-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentIntentId }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to cancel payment (${response.status})`);
  }
  
  return await response.json();
}

// Export Stripe-related objects and variables
export { 
  stripePromise, 
  Elements,
  stripeConfigError
};