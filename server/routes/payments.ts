/**
 * Payment routes for RFP featuring
 */

import { Router } from 'express';
import { createPaymentIntent, verifyPayment } from '../lib/stripe';
import { storage } from '../storage';

const router = Router();

// Create a payment intent for featuring an RFP
router.post('/api/payments/create-intent', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rfpId } = req.body;
    
    // Create a payment intent
    const paymentIntent = await createPaymentIntent({
      userId: req.user.id,
      rfpId: rfpId || undefined,
    });

    // Return the client secret to the client
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment and update RFP's featured status
router.post('/api/payments/confirm', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { paymentIntentId, rfpId } = req.body;

    // Verify the payment was successful
    const paymentSucceeded = await verifyPayment(paymentIntentId);
    if (!paymentSucceeded) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // If an RFP ID was provided, update its featured status
    if (rfpId) {
      const rfp = await storage.getRfpById(Number(rfpId));
      
      // Ensure the RFP exists and belongs to the user
      if (!rfp) {
        return res.status(404).json({ error: 'RFP not found' });
      }
      
      if (rfp.organizationId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized to update this RFP' });
      }
      
      // Update the RFP to featured status
      await storage.updateRfp(Number(rfpId), { featured: true });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

export default router;