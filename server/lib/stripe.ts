/**
 * Stripe integration utilities
 * Handles payment processing for featured RFPs
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key from env
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY environment variable is not set');
  throw new Error('Stripe configuration is required for payment processing');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Define featured RFP price (in cents)
export const FEATURED_RFP_PRICE = 2500; // $25.00

/**
 * Create a payment intent for featuring an RFP
 * 
 * @param metadata Additional data to attach to the payment intent
 * @returns The payment intent with client secret
 */
export async function createPaymentIntent(metadata: { 
  userId: string, 
  rfpId: string,
  rfpTitle?: string 
}): Promise<Stripe.PaymentIntent> {
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
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
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
 */
export async function verifyPayment(paymentIntentId: string): Promise<boolean> {
  const paymentIntent = await getPaymentIntent(paymentIntentId);
  return paymentIntent?.status === 'succeeded';
}

export default stripe;