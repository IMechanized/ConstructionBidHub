/**
 * Stripe Payment Processing Service
 * Handles all payment functionality for the FindConstructionBids platform
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
let stripe = null;

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
 * @param {Object} metadata Additional information to store with the payment
 * @param {string} metadata.rfpId RFP identifier
 * @param {string} metadata.userId User identifier
 * @param {string} metadata.rfpTitle RFP title for the description
 * @returns {Promise<Object>} The created payment intent
 */
export async function createPaymentIntent(metadata) {
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
      description: `Featured RFP: ${metadata.rfpTitle ? metadata.rfpTitle.substring(0, 50) : 'unknown'}`
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
 * @param {string} paymentIntentId The ID of the payment intent
 * @returns {Promise<Object|null>} The payment intent or null if not found
 */
export async function getPaymentIntent(paymentIntentId) {
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
 * @param {string} paymentIntentId The ID of the payment intent to verify
 * @returns {Promise<boolean>} True if the payment succeeded, false otherwise
 */
export async function verifyPayment(paymentIntentId) {
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
 * @param {string} paymentIntentId The ID of the payment intent to cancel
 * @returns {Promise<boolean>} True if canceled successfully, false otherwise
 */
export async function cancelPayment(paymentIntentId) {
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

// Export Stripe instance and configuration status
export const stripeStatus = {
  isInitialized: Boolean(stripe)
};

export default stripe;