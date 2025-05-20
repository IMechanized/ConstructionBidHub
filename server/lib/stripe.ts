/**
 * Stripe integration utilities
 * Handles payment processing for featured RFPs
 */

import Stripe from 'stripe';

// Set price for featuring an RFP ($25.00 in cents)
export const FEATURED_RFP_PRICE = 2500;

// Get Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe with proper error handling
let stripe: Stripe | null = null;
try {
  if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
    // Initialize without specifying apiVersion to use the default current version
    stripe = new Stripe(stripeSecretKey);
    console.log('✅ Stripe initialized successfully');
  } else {
    console.error('❌ Invalid Stripe secret key format');
  }
} catch (error) {
  console.error('❌ Failed to initialize Stripe:', error);
}

/**
 * Create a payment intent for featuring an RFP
 * 
 * @param metadata Additional information about the payment
 * @returns The created payment intent
 * @throws Error if Stripe is not initialized
 */
export async function createPaymentIntent(metadata: { 
  rfpId: string;
  userId: string;
  rfpTitle: string;
}): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check your API keys.');
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: FEATURED_RFP_PRICE,
      currency: 'usd',
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Featured RFP: ${metadata.rfpTitle.substring(0, 50)}...`,
    });
    
    console.log(`Payment intent created for RFP ${metadata.rfpId}: ${paymentIntent.id}`);
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
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
  
  try {
    const paymentIntent = await getPaymentIntent(paymentIntentId);
    return paymentIntent?.status === 'succeeded';
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}

/**
 * Cancel a payment intent
 * 
 * @param paymentIntentId The ID of the payment intent to cancel
 * @returns True if successfully canceled, false otherwise
 * @throws Error if Stripe is not initialized
 */
export async function cancelPayment(paymentIntentId: string): Promise<boolean> {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Please check your API keys.');
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return paymentIntent.status === 'canceled';
  } catch (error) {
    console.error('Error canceling payment intent:', error);
    return false;
  }
}

// Export status indicators to help with environment detection
export const stripeStatus = {
  isInitialized: Boolean(stripe),
  mode: process.env.NODE_ENV || 'development',
  keyType: stripeSecretKey?.startsWith('sk_test_') ? 'test' : 'live'
};

// Export the Stripe instance
export default stripe;