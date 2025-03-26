/**
 * Payment routes for RFP featuring
 */
import express from 'express';
import { storage } from '../storage';
import { createPaymentIntent, verifyPayment, getPaymentIntent, FEATURED_RFP_PRICE } from '../lib/stripe';

const router = express.Router();

// Get the featured listing price
router.get('/price', (req, res) => {
  res.json({ price: FEATURED_RFP_PRICE });
});

// Create a payment intent for featuring an RFP
router.post('/create-payment-intent', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { rfpId } = req.body;
    
    if (!rfpId) {
      return res.status(400).json({ message: "RFP ID is required" });
    }

    // Verify the RFP exists and belongs to this user
    const rfp = await storage.getRfpById(Number(rfpId));
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }
    
    if (rfp.organizationId !== req.user!.id) {
      return res.status(403).json({ message: "You can only feature your own RFPs" });
    }

    // Create the payment intent
    const paymentIntent = await createPaymentIntent({
      rfpId: Number(rfpId),
      userId: req.user!.id
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create payment intent"
    });
  }
});

// Confirm a payment and update the RFP featured status
router.post('/confirm-payment', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { paymentIntentId, rfpId } = req.body;
    
    if (!paymentIntentId || !rfpId) {
      return res.status(400).json({ message: "Payment intent ID and RFP ID are required" });
    }

    // Verify the payment was successful
    const isPaymentValid = await verifyPayment(paymentIntentId);
    
    if (!isPaymentValid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update the RFP to be featured
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

// Get payment status by ID
router.get('/status/:paymentIntentId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { paymentIntentId } = req.params;
    const paymentIntent = await getPaymentIntent(paymentIntentId);
    
    if (!paymentIntent) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Verify this payment belongs to the current user
    const { rfpId, userId } = paymentIntent.metadata as { rfpId: string, userId: string };
    if (userId !== String(req.user!.id)) {
      return res.status(403).json({ message: "Unauthorized to view this payment" });
    }
    
    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      created: paymentIntent.created,
      rfpId
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to fetch payment status"
    });
  }
});

export default router;