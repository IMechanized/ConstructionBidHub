/**
 * Payment Routes for RFP featuring
 * Handles all payment-related API endpoints
 */

import express from 'express';
import { storage } from '../storage.js';
import { 
  createPaymentIntent, 
  verifyPayment, 
  getPaymentIntent, 
  cancelPayment,
  FEATURED_RFP_PRICE, 
  stripeStatus 
} from '../lib/stripe.js';

const router = express.Router();

/**
 * Get the featured listing price
 */
router.get('/price', (req, res) => {
  res.json({ price: FEATURED_RFP_PRICE });
});

/**
 * Get current Stripe configuration status
 */
router.get('/config', (req, res) => {
  res.json(stripeStatus);
});

/**
 * Create a payment intent for featuring an RFP
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { rfpId } = req.body;

    if (!rfpId) {
      return res.status(400).json({ message: "RFP ID is required" });
    }

    const rfp = await storage.getRfpById(Number(rfpId));
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }

    if (rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only feature your own RFPs" });
    }

    const paymentIntent = await createPaymentIntent({
      rfpId: String(rfpId),
      userId: String(req.user.id),
      rfpTitle: rfp.title
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create payment intent"
    });
  }
});

/**
 * Confirm a payment and mark RFP as featured
 */
router.post('/confirm-payment', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { paymentIntentId, rfpId } = req.body;

    if (!paymentIntentId || !rfpId) {
      return res.status(400).json({ message: "Payment intent ID and RFP ID are required" });
    }

    const rfp = await storage.getRfpById(Number(rfpId));
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }

    if (rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only feature your own RFPs" });
    }

    const paymentVerified = await verifyPayment(paymentIntentId);

    if (!paymentVerified) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const updatedRfp = await storage.updateRfp(Number(rfpId), {
      featured: true,
      featuredAt: new Date()
    });

    res.json({
      success: true,
      rfp: updatedRfp
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to confirm payment"
    });
  }
});

/**
 * Get payment status
 */
router.get('/status/:paymentIntentId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({ message: "Payment intent ID is required" });
    }

    const paymentIntent = await getPaymentIntent(paymentIntentId);

    if (!paymentIntent) {
      return res.status(404).json({ message: "Payment intent not found" });
    }

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      created: paymentIntent.created,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch payment status"
    });
  }
});

/**
 * Cancel a payment intent
 */
router.post('/cancel-payment', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: "Payment intent ID is required" });
    }

    const paymentIntent = await getPaymentIntent(paymentIntentId);

    if (!paymentIntent) {
      return res.status(404).json({ message: "Payment intent not found" });
    }

    if (paymentIntent.metadata.userId !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only cancel your own payments" });
    }

    const cancelled = await cancelPayment(paymentIntentId);

    if (!cancelled) {
      return res.status(400).json({ message: "Failed to cancel payment" });
    }

    res.json({
      success: true,
      message: "Payment cancelled successfully"
    });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to cancel payment"
    });
  }
});

export default router;