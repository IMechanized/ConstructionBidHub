/**
 * Stripe Debug Helper
 * Tools to help debug Stripe integration issues, particularly with test keys
 */

const fs = require('fs');
const path = require('path');

// Directory to store logs
const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Log Stripe API activity to a file
 * @param {string} action - The action being performed (create, retrieve, etc.)
 * @param {string} objectType - The type of Stripe object (payment_intent, etc.)
 * @param {Object} data - The response data from Stripe
 * @param {string} keyType - The type of key used (test or live)
 */
function logStripeActivity(action, objectType, data, keyType) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    objectType,
    keyType,
    success: !!data,
    data: sanitizeData(data)
  };
  
  const logFile = path.join(LOG_DIR, `stripe-${keyType}-${timestamp.split('T')[0]}.log`);
  
  fs.appendFileSync(
    logFile, 
    JSON.stringify(logEntry, null, 2) + '\n\n', 
    'utf8'
  );
  
  // Also log to console
  console.log(`🔍 Stripe ${keyType} activity: ${action} ${objectType} ${data ? 'succeeded' : 'failed'}`);
  
  if (data) {
    // Truncate sensitive fields for console logging
    console.log(`📝 Response: ${JSON.stringify(sanitizeData(data, true)).substring(0, 200)}...`);
  }
}

/**
 * Sanitize sensitive data for logging
 * @param {Object} data - The data to sanitize
 * @param {boolean} truncate - Whether to truncate long values for console output
 * @returns {Object} - Sanitized data
 */
function sanitizeData(data, truncate = false) {
  if (!data) return null;
  
  // Clone the data to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Mask sensitive fields
  if (sanitized.client_secret) {
    sanitized.client_secret = sanitized.client_secret.substring(0, 10) + '...';
  }
  
  if (sanitized.object === 'payment_intent') {
    // Add specific fields we care about
    const keysToKeep = ['id', 'amount', 'currency', 'status', 'created', 'metadata'];
    Object.keys(sanitized).forEach(key => {
      if (!keysToKeep.includes(key)) {
        delete sanitized[key];
      }
    });
  }
  
  return sanitized;
}

/**
 * Intercept and log Stripe API calls
 * @param {Object} stripe - The Stripe instance to intercept
 * @param {string} keyType - The type of key being used (test or live)
 * @returns {Object} - The intercepted Stripe instance
 */
function interceptStripeApi(stripe, keyType) {
  if (!stripe) return null;
  
  // Store original methods
  const originalCreate = stripe.paymentIntents.create;
  const originalRetrieve = stripe.paymentIntents.retrieve;
  
  // Intercept create
  stripe.paymentIntents.create = async (...args) => {
    console.log(`🔔 Intercepted paymentIntents.create with ${keyType} key`);
    try {
      const result = await originalCreate.apply(stripe.paymentIntents, args);
      logStripeActivity('create', 'payment_intent', result, keyType);
      return result;
    } catch (error) {
      console.error(`❌ Error in intercepted paymentIntents.create: ${error.message}`);
      throw error;
    }
  };
  
  // Intercept retrieve
  stripe.paymentIntents.retrieve = async (...args) => {
    console.log(`🔔 Intercepted paymentIntents.retrieve with ${keyType} key`);
    try {
      const result = await originalRetrieve.apply(stripe.paymentIntents, args);
      logStripeActivity('retrieve', 'payment_intent', result, keyType);
      return result;
    } catch (error) {
      console.error(`❌ Error in intercepted paymentIntents.retrieve: ${error.message}`);
      throw error;
    }
  };
  
  return stripe;
}

module.exports = {
  interceptStripeApi,
  logStripeActivity
};