/**
 * Stripe Payment Processing Utilities
 * Handles all payment operations for the FindConstructionBids platform
 */

import Stripe from 'stripe';

// Feature pricing in cents ($25.00)
export const FEATURED_RFP_PRICE = 2500;

// Get Stripe secret key from environment variables with fallback options
const possibleKeys = [
  process.env.STRIPE_SECRET_KEY,
  process.env.STRIPE_SK,
  process.env.STRIPE_API_KEY,
  process.env.STRIPE_KEY
];

const stripeSecretKey = possibleKeys.find(key => 
  key && typeof key === 'string' && key.startsWith('sk_')
);

// Initialize Stripe instance
let stripe: Stripe | null = null;

try {
  if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey);
    console.log('✅ Stripe payment processing initialized successfully');
  } else {
    console.warn('⚠️ No valid Stripe secret key found - payment features will be limited');
  }
} catch (error) {
  console.error('❌ Failed to initialize Stripe:', error);
}

/**
 * Create a payment intent for featuring an RFP
 * 
 * @param metadata Additional information to store with the payment
 * @returns The created payment intent
 */
export async function createPaymentIntent(metadata: {
  rfpId: string;
  userId: string;
  rfpTitle: string;
}): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Payment service unavailable: Stripe is not initialized');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: FEATURED_RFP_PRICE,
      currency: 'usd',
      metadata,
      automatic_payment_methods: {
        enabled: true, // Allow multiple payment methods
      },
      description: `Featured RFP: ${metadata.rfpTitle.substring(0, 50)}`,
    });

    console.log(`Created payment intent ${paymentIntent.id} for RFP ${metadata.rfpId}`);
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Retrieve a payment intent by ID
 * 
 * @param paymentIntentId The ID of the payment intent
 * @returns The payment intent or null if not found
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) {
    throw new Error('Payment service unavailable: Stripe is not initialized');
  }

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return null;
  }
}

/**
 * Verify that a payment has succeeded
 * 
 * @param paymentIntentId The ID of the payment intent to verify
 * @returns True if the payment succeeded, false otherwise
 */
export async function verifyPayment(paymentIntentId: string): Promise<boolean> {
  if (!stripe) {
    throw new Error('Payment service unavailable: Stripe is not initialized');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}

/**
 * Cancel a payment intent
 * 
 * @param paymentIntentId The ID of the payment intent to cancel
 * @returns True if canceled successfully, false otherwise
 */
export async function cancelPayment(paymentIntentId: string): Promise<boolean> {
  if (!stripe) {
    throw new Error('Payment service unavailable: Stripe is not initialized');
  }

  try {
    const result = await stripe.paymentIntents.cancel(paymentIntentId);
    return result.status === 'canceled';
  } catch (error) {
    console.error('Error canceling payment intent:', error);
    return false;
  }
}

// Export Stripe instance status
export const stripeStatus = {
  isInitialized: Boolean(stripe)
};

export default stripe;