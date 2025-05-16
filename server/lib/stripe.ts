/**
 * Stripe integration utilities
 * Handles payment processing for featured RFPs
 */

import Stripe from 'stripe';

// Determine which Stripe secret key to use based on environment
const isProduction = process.env.NODE_ENV === 'production';
const stripeSecretKey = isProduction 
  ? process.env.STRIPE_LIVE_SECRET_KEY 
  : process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

// Initialize Stripe with appropriate secret key
const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey) 
  : null;

// Log which environment we're using
console.log(`Stripe mode: ${isProduction ? 'live' : 'test'}`);
console.log(`Stripe initialized: ${Boolean(stripe)}`);

if (!stripe) {
  console.warn('Stripe secret key not set for current environment - payment features will be disabled');
}

// Define featured RFP price (in cents)
export const FEATURED_RFP_PRICE = 2500; // $25.00

/**
 * Create a payment intent for featuring an RFP
 * 
 * @param metadata Additional data to attach to the payment intent
 * @returns The payment intent with client secret
 * @throws Error if Stripe is not initialized or payment creation fails
 */
export async function createPaymentIntent(metadata: { 
  userId: string, 
  rfpId: string,
  rfpTitle?: string 
}): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check your API keys.');
  }

  return stripe.paymentIntents.create({
    amount: FEATURED_RFP_PRICE,
    currency: 'usd',
    metadata, // Store user and RFP data for reference
    description: metadata.rfpTitle ? `Featured listing for RFP: ${metadata.rfpTitle}` : 'Featured RFP listing',
    automatic_payment_methods: { 
      enabled: true, // Automatically enables the best payment methods for the customer
    },
  });
}

/**
 * Retrieve a payment intent by ID
 * 
 * @param paymentIntentId The ID of the payment intent to retrieve
 * @returns The payment intent or null if not found
 * @throws Error if Stripe is not initialized
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check your API keys.');
  }
  
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return null;
  }
}

/**
 * Verify a payment was successful
 * 
 * @param paymentIntentId The ID of the payment intent to verify
 * @returns True if payment succeeded, false otherwise
 * @throws Error if Stripe is not initialized
 */
export async function verifyPayment(paymentIntentId: string): Promise<boolean> {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check your API keys.');
  }
  
  const paymentIntent = await getPaymentIntent(paymentIntentId);
  return paymentIntent?.status === 'succeeded';
}

// Export status indicators to help with environment detection
export const stripeStatus = {
  isInitialized: Boolean(stripe),
  mode: isProduction ? 'live' : 'test',
  keyType: stripeSecretKey?.startsWith('sk_live') ? 'live' : 'test'
};

export default stripe;