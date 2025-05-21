/**
 * Stripe Debug Routes
 * Special routes to help diagnose issues with Stripe integration
 * 
 * These routes are useful for understanding differences between test and live keys
 */

function registerStripeDebugRoutes(app, stripe, stripeStatus) {
  // Get current Stripe configuration
  app.get('/api/stripe-debug/status', (req, res) => {
    // Return information about current Stripe configuration
    const info = {
      isInitialized: Boolean(stripe),
      keyType: stripeStatus.keyType,
      mode: process.env.NODE_ENV || 'development',
      isAuthenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? {
        id: req.user.id,
        email: req.user.email
      } : null
    };
    
    console.log('Stripe Debug Status:', JSON.stringify(info));
    res.json(info);
  });
  
  // Test a simple Stripe operation
  app.get('/api/stripe-debug/test', async (req, res) => {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not initialized'
      });
    }
    
    try {
      // Attempt to retrieve Stripe account information
      // This is a simple operation that helps verify connection
      const account = await stripe.account.retrieve();
      
      // Return success with basic account info
      return res.json({
        success: true,
        keyType: stripeStatus.keyType,
        account: {
          id: account.id,
          object: account.object,
          type: account.type,
          created: account.created
        }
      });
    } catch (error) {
      console.error('Stripe Debug Test Error:', error.message);
      
      // Return detailed error information to help diagnose
      return res.status(500).json({
        success: false,
        keyType: stripeStatus.keyType,
        error: {
          message: error.message,
          type: error.type,
          code: error.code,
          statusCode: error.statusCode
        }
      });
    }
  });
}

module.exports = registerStripeDebugRoutes;