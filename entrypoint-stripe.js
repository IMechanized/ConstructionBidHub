/**
 * Stripe Payment Processing Module
 * 
 * A complete implementation of Stripe payment processing for featuring RFPs
 * This module handles all payment-related functionality including:
 * - Creating payment intents
 * - Processing payments
 * - Verifying payment status
 * - Cancelling payments
 */

// Set the price for featuring an RFP ($25.00 in cents)
const FEATURED_RFP_PRICE = 2500;

// Initialize Stripe with proper error handling
function initializeStripe() {
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
  
  // Determine if we're in production mode
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Prepare stripe status object
  let stripeStatus = {
    isInitialized: false,
    mode: process.env.NODE_ENV || 'development',
    keyType: 'none'
  };
  
  // Initialize Stripe
  let stripe = null;
  
  try {
    if (stripeSecretKey) {
      const Stripe = require('stripe');
      stripe = new Stripe(stripeSecretKey);
      
      stripeStatus = {
        isInitialized: true,
        mode: process.env.NODE_ENV || 'development',
        keyType: stripeSecretKey.startsWith('sk_test_') ? 'test' : 'live'
      };
      
      console.log('✅ Stripe payment processing initialized successfully');
    } else {
      console.warn('⚠️ No valid Stripe secret key found - payment features will be limited');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error);
  }
  
  return { stripe, stripeStatus, isProduction };
}

// Register payment-related routes
function registerPaymentRoutes(app, { stripe, stripeStatus, isProduction }, storage, requireAuth) {
  // Get price for featuring an RFP
  app.get('/api/payments/price', (req, res) => {
    res.json({ price: FEATURED_RFP_PRICE });
  });

  // Get Stripe configuration information
  app.get('/api/payments/config', (req, res) => {
    res.json(stripeStatus);
  });

  // Create payment intent for featuring an RFP
  app.post('/api/payments/create-payment-intent', requireAuth, async (req, res) => {
    try {
      const { rfpId } = req.body;

      if (!rfpId) {
        return res.status(400).json({ message: "RFP ID is required" });
      }

      // Verify the RFP exists and belongs to this user
      const rfp = await storage.getRfpById(Number(rfpId));
      if (!rfp) {
        return res.status(404).json({ message: "RFP not found" });
      }

      if (rfp.organizationId !== req.user.id) {
        return res.status(403).json({ message: "You can only feature your own RFPs" });
      }

      // Create payment intent
      let paymentIntent;

      if (stripe) {
        try {
          // Create real payment intent with Stripe
          paymentIntent = await stripe.paymentIntents.create({
            amount: FEATURED_RFP_PRICE,
            currency: 'usd',
            metadata: {
              rfpId: String(rfpId),
              userId: String(req.user.id),
              rfpTitle: rfp.title
            },
            automatic_payment_methods: {
              enabled: true
            },
            description: `Featured RFP: ${rfp.title.substring(0, 50)}`
          });
          console.log(`✅ Created payment intent ${paymentIntent.id} for RFP ${rfpId}`);
        } catch (stripeError) {
          console.error('❌ Stripe error creating payment intent:', stripeError);
          
          // In development, provide a mock payment intent for testing
          if (!isProduction) {
            console.log('⚠️ Using mock payment intent for development (Stripe error)');
            paymentIntent = {
              client_secret: 'mock_client_secret_for_development',
              amount: FEATURED_RFP_PRICE
            };
          } else {
            return res.status(500).json({ 
              message: "Payment service error: " + stripeError.message,
              reason: 'stripe_error'
            });
          }
        }
      } else {
        // If Stripe is not available, provide a mock in development
        if (!isProduction) {
          console.log('⚠️ Using mock payment intent for development (Stripe not available)');
          paymentIntent = {
            client_secret: 'mock_client_secret_for_development',
            amount: FEATURED_RFP_PRICE
          };
        } else {
          return res.status(503).json({ 
            message: "Payment service is currently unavailable. Stripe is not initialized.",
            reason: 'stripe_not_initialized'
          });
        }
      }

      // Send the client secret back to the client
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
      });
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create payment intent"
      });
    }
  });

  // Confirm payment and update RFP featured status
  app.post('/api/payments/confirm-payment', requireAuth, async (req, res) => {
    try {
      const { paymentIntentId, rfpId } = req.body;
      
      if (!paymentIntentId || !rfpId) {
        return res.status(400).json({ message: "Payment intent ID and RFP ID are required" });
      }
      
      // Verify the RFP exists and belongs to this user
      const rfp = await storage.getRfpById(Number(rfpId));
      if (!rfp) {
        return res.status(404).json({ message: "RFP not found" });
      }
      
      if (rfp.organizationId !== req.user.id) {
        return res.status(403).json({ message: "You can only feature your own RFPs" });
      }
      
      // Handle mock payments in development environment
      let paymentVerified = false;
      
      if (paymentIntentId === 'mock_client_secret_for_development' && !isProduction) {
        console.log('⚠️ Processing mock payment confirmation for development');
        paymentVerified = true;
      } else {
        // Verify payment with Stripe
        if (!stripe) {
          return res.status(503).json({ 
            message: 'Payment service unavailable. Stripe is not initialized.',
            reason: 'stripe_not_initialized'
          });
        }
        
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          paymentVerified = paymentIntent.status === 'succeeded';
          
          if (!paymentVerified) {
            console.log(`❌ Payment ${paymentIntentId} verification failed: ${paymentIntent.status}`);
            return res.status(400).json({ 
              message: `Payment verification failed: ${paymentIntent.status}` 
            });
          }
        } catch (stripeError) {
          console.error('❌ Error retrieving payment intent:', stripeError);
          return res.status(500).json({ 
            message: "Error verifying payment: " + stripeError.message
          });
        }
      }
      
      // Update the RFP to be featured
      const updatedRfp = await storage.updateRfp(Number(rfpId), {
        featured: true,
        featuredAt: new Date()
      });
      
      console.log(`✅ RFP ${rfpId} successfully marked as featured`);
      
      res.json({
        success: true,
        rfp: updatedRfp
      });
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to confirm payment"
      });
    }
  });

  // Get payment status
  app.get('/api/payments/status/:paymentIntentId', requireAuth, async (req, res) => {
    try {
      const { paymentIntentId } = req.params;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      
      // Handle mock payments in development
      if (paymentIntentId === 'mock_client_secret_for_development' && !isProduction) {
        return res.json({
          id: 'mock_pi_' + Date.now(),
          status: 'succeeded',
          amount: FEATURED_RFP_PRICE,
          created: Date.now() / 1000,
          metadata: {
            rfpId: req.query.rfpId || '1',
            userId: req.user.id.toString()
          }
        });
      }

      // Verify with Stripe if available
      if (!stripe) {
        return res.status(503).json({ 
          message: 'Payment service unavailable. Stripe is not initialized.',
          reason: 'stripe_not_initialized'
        });
      }
      
      // Get payment intent from Stripe
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        res.json({
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          created: paymentIntent.created,
          metadata: paymentIntent.metadata
        });
      } catch (stripeError) {
        console.error('❌ Error retrieving payment intent:', stripeError);
        
        if (stripeError.code === 'resource_missing') {
          return res.status(404).json({ message: "Payment intent not found" });
        }
        
        return res.status(500).json({ 
          message: "Error retrieving payment: " + stripeError.message
        });
      }
    } catch (error) {
      console.error('❌ Error fetching payment status:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to fetch payment status"
      });
    }
  });

  // Cancel a payment intent
  app.post('/api/payments/cancel-payment', requireAuth, async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      
      // Handle mock payments in development
      if (paymentIntentId === 'mock_client_secret_for_development' && !isProduction) {
        console.log('⚠️ Cancelling mock payment in development mode');
        return res.json({
          success: true,
          message: "Mock payment cancelled successfully"
        });
      }
      
      // Verify with Stripe if available
      if (!stripe) {
        return res.status(503).json({ 
          message: 'Payment service unavailable. Stripe is not initialized.',
          reason: 'stripe_not_initialized'
        });
      }
      
      // Get the payment intent from Stripe
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } catch (stripeError) {
        console.error('❌ Error retrieving payment intent:', stripeError);
        
        if (stripeError.code === 'resource_missing') {
          return res.status(404).json({ message: "Payment intent not found" });
        }
        
        return res.status(500).json({ 
          message: "Error retrieving payment: " + stripeError.message
        });
      }
      
      // Verify ownership
      if (paymentIntent.metadata.userId !== String(req.user.id)) {
        return res.status(403).json({ message: "You can only cancel your own payments" });
      }
      
      // Cancel the payment intent
      try {
        const cancelledPayment = await stripe.paymentIntents.cancel(paymentIntentId);
        
        if (cancelledPayment.status === 'canceled') {
          console.log(`✅ Payment ${paymentIntentId} successfully cancelled`);
          return res.json({
            success: true,
            message: "Payment cancelled successfully"
          });
        } else {
          return res.status(400).json({ 
            message: `Failed to cancel payment: ${cancelledPayment.status}`
          });
        }
      } catch (stripeError) {
        console.error('❌ Error cancelling payment intent:', stripeError);
        return res.status(500).json({ 
          message: "Error cancelling payment: " + stripeError.message
        });
      }
    } catch (error) {
      console.error('❌ Error cancelling payment:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to cancel payment"
      });
    }
  });
}

module.exports = {
  FEATURED_RFP_PRICE,
  initializeStripe,
  registerPaymentRoutes
};