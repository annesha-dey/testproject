import express from "express";
import BillingManager from "../utils/billingManager.js";
import { validateSession } from "../middleware/auth.js";
import shopify from "../config/shopify.js";

const router = express.Router();
// Initialize BillingManager with the Shopify API object
const billingManager = new BillingManager(shopify.api); 

/**
 * Get all available billing plans (public endpoint)
 */
router.get("/plans", async (req, res) => {
try {
const plans = await billingManager.getPlans();
res.json({
success: true,
plans
});
} catch (error) {
res.status(500).json({
success: false,
error: error.message
});
}
});

/**
 * Get current subscription for authenticated shop
 */
router.get("/subscription", validateSession, async (req, res) => {
 try {
  const { shop } = req.query;
  const subscription = await billingManager.getCurrentSubscription(shop);
  
  res.json({
   success: true,
   subscription,
   hasActiveSubscription: await billingManager.hasActiveSubscription(shop)
  });
 } catch (error) {
  res.status(500).json({
   success: false,
   error: error.message
  });
 }
});

/**
 * Create a new recurring charge for a plan
 */
router.post("/subscribe", validateSession, async (req, res) => {
 try {
  console.log(`🚀 BillingRoutes: POST /subscribe request received`);
  
  const { shop } = req.query;
  const { planId } = req.body;
  
  console.log(`📋 BillingRoutes: Request details:`, {
   shop,
   planId,
   body: req.body,
   query: req.query,
   headers: {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']
   }
  });
  
  if (!planId) {
   console.log(`❌ BillingRoutes: Missing planId in request`);
   return res.status(400).json({
    success: false,
    error: "Plan ID is required"
   });
  }

  console.log(`🔍 BillingRoutes: Checking for existing active subscription...`);
  const hasActive = await billingManager.hasActiveSubscription(shop);
  if (hasActive) {
   console.log(`❌ BillingRoutes: Shop ${shop} already has active subscription`);
   return res.status(400).json({
    success: false,
    error: "Shop already has an active subscription"
   });
  }

  const returnUrl = `${process.env.SHOPIFY_APP_URL}/billing/callback?shop=${shop}`;
  console.log(`🔗 BillingRoutes: Constructed return URL: ${returnUrl}`);
  
  console.log(`⏳ BillingRoutes: Calling billingManager.createRecurringCharge...`);
  const result = await billingManager.createRecurringCharge(shop, planId, returnUrl);
  
  console.log(`✅ BillingRoutes: Charge created successfully:`, {
   chargeId: result.chargeId,
   confirmationUrl: result.confirmationUrl,
   shop
  });
  
  const response = {
   success: true,
   chargeId: result.chargeId,
   confirmationUrl: result.confirmationUrl,
   message: "Redirect user to confirmation URL to accept the charge"
  };
  
  console.log(`📤 BillingRoutes: Sending success response:`, response);
  res.json(response);
 } catch (error) {
  const { shop } = req.query;
  const { planId } = req.body;
  
  console.error(`❌ BillingRoutes: Error in /subscribe:`, {
   message: error.message,
   stack: error.stack?.split('\n').slice(0, 3),
   shop,
   planId
  });
  
  const errorResponse = {
   success: false,
   error: error.message
  };
  
  console.log(`📤 BillingRoutes: Sending error response:`, errorResponse);
  res.status(500).json(errorResponse);
 }
});

/**
 * Handle billing callback after user accepts/declines charge
 */
router.get("/callback", validateSession, async (req, res) => {
 try {
  const { shop, charge_id } = req.query;
  
  if (!charge_id) {
   // If merchant declines, they are redirected here without a charge_id (or with an error status).
   // We redirect them to the app root with an error parameter.
   return res.redirect(`${process.env.SHOPIFY_APP_URL}?shop=${shop}&billing_error=no_charge_id`);
  }

  try {
   // Check if this is a mock charge (development store)
   if (charge_id.startsWith('dev_mock_')) {
    console.log(`🎭 Processing mock charge activation: ${charge_id}`);
    
    // For mock charges, just update the database status to ACTIVE
    const Subscription = (await import('../models/Subscription.js')).default;
    const subscription = await Subscription.findOneAndUpdate(
     { shopifyChargeId: charge_id, shop },
     { status: 'ACTIVE', activatedOn: new Date() },
     { new: true }
    );
    
    if (!subscription) {
     throw new Error('Mock subscription not found');
    }
    
    console.log(`✅ Mock charge activated successfully: ${charge_id}`);
    // Redirect to success page
    res.redirect(`${process.env.SHOPIFY_APP_URL}?shop=${shop}&billing_success=true&plan=${subscription.planId}`);
   } else {
    // Real Shopify charge - use the normal activation flow
    const subscription = await billingManager.activateCharge(shop, charge_id);
    
    // Redirect to success page
    res.redirect(`${process.env.SHOPIFY_APP_URL}?shop=${shop}&billing_success=true&plan=${subscription.planId}`);
   }
  } catch (error) {
   console.error("Charge activation failed:", error);
   // Redirect to error page
   res.redirect(`${process.env.SHOPIFY_APP_URL}?shop=${shop}&billing_error=activation_failed`);
  }
 } catch (error) {
  res.status(500).json({
   success: false,
   error: error.message
  });
 }
});

/**
 * Cancel current subscription
 */
router.post("/cancel", validateSession, async (req, res) => {
 try {
  const { shop } = req.query;
  const subscription = await billingManager.getCurrentSubscription(shop);
  
  if (!subscription || subscription.status !== 'ACTIVE') {
   return res.status(400).json({
    success: false,
    error: "No active subscription found"
   });
  }

  await billingManager.cancelCharge(shop, subscription.shopifyChargeId);
  
  res.json({
   success: true,
   message: "Subscription cancelled successfully"
  });
 } catch (error) {
  res.status(500).json({
   success: false,
   error: error.message
  });
 }
});

/**
 * Get subscription history
 */
router.get("/history", validateSession, async (req, res) => {
 try {
  const { shop } = req.query;
  const history = await billingManager.getSubscriptionHistory(shop);
  
  res.json({
   success: true,
   history
  });
 } catch (error) {
  res.status(500).json({
   success: false,
   error: error.message
  });
 }
});

/**
 * Sync subscription status with Shopify
 */
router.post("/sync", validateSession, async (req, res) => {
 try {
  const { shop } = req.query;
  const subscription = await billingManager.syncSubscriptionStatus(shop);
  
  res.json({
   success: true,
   subscription
  });
 } catch (error) {
  res.status(500).json({
   success: false,
   error: error.message
  });
 }
});

/**
 * Mock confirmation endpoint for development stores
 * Simulates the Shopify billing confirmation flow
 */
router.get("/mock-confirm", async (req, res) => {
 try {
  const { charge_id, shop } = req.query;
  
  console.log(`🎭 Mock confirmation accessed:`, { charge_id, shop });
  
  if (!charge_id || !shop) {
   return res.status(400).send(`
    <html>
     <head><title>Mock Billing - Error</title></head>
     <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
      <h1>❌ Missing Parameters</h1>
      <p>Both charge_id and shop parameters are required.</p>
     </body>
    </html>
   `);
  }

  // Create a simple confirmation page that simulates Shopify's billing flow
  const confirmationPage = `
   <html>
    <head>
     <title>Mock Billing Confirmation</title>
     <style>
      body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
      .container { text-align: center; }
      .charge-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .button { display: inline-block; padding: 12px 24px; margin: 10px; text-decoration: none; border-radius: 4px; font-weight: bold; }
      .accept { background: #28a745; color: white; }
      .decline { background: #dc3545; color: white; }
      .accept:hover { background: #218838; }
      .decline:hover { background: #c82333; }
     </style>
    </head>
    <body>
     <div class="container">
      <h1>🎭 Mock Billing Confirmation</h1>
      <p><strong>Development Store:</strong> ${shop}</p>
      
      <div class="charge-details">
       <h3>Subscription Details</h3>
       <p><strong>Charge ID:</strong> ${charge_id}</p>
       <p><strong>Type:</strong> Mock Development Charge</p>
       <p><strong>Status:</strong> Pending Approval</p>
       <p><em>Note: This is a simulated billing flow for development purposes. No real charges will be made.</em></p>
      </div>
      
      <h3>Choose an Action:</h3>
      <a href="/api/billing/callback?shop=${shop}&charge_id=${charge_id}" class="button accept">
       ✅ Accept Subscription
      </a>
      <a href="/api/billing/callback?shop=${shop}&billing_error=declined" class="button decline">
       ❌ Decline Subscription
      </a>
      
      <div style="margin-top: 30px; font-size: 12px; color: #666;">
       <p>This is a mock confirmation page for development stores.</p>
       <p>In production, this would be handled by Shopify's actual billing system.</p>
      </div>
     </div>
    </body>
   </html>
  `;
  
  res.send(confirmationPage);
 } catch (error) {
  console.error(`❌ Error in mock confirmation:`, error);
  res.status(500).send(`
   <html>
    <head><title>Mock Billing - Error</title></head>
    <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
     <h1>❌ Error</h1>
     <p>An error occurred: ${error.message}</p>
    </body>
   </html>
  `);
 }
});

export default router;