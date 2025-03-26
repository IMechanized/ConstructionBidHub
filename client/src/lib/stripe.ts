/**
 * Client-side Stripe utilities
 */

import { loadStripe } from '@stripe/stripe-js';

// Load Stripe instance with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

export default stripePromise;