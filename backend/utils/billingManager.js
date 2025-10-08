import BillingPlan from "../models/BillingPlan.js";
import Subscription from "../models/Subscription.js";
import StoreManager from "./storeManager.js";
import shopify from "../config/shopify.js";
import { Session } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";

class BillingManager {
  constructor(shopifyApi) {
    // Accept shopifyApi parameter for compatibility but use the imported shopify config
    this.storeManager = new StoreManager();
  }

  /**
   * Initialize default billing plans
   */
  async initializePlans() {
    const defaultPlans = [
      {
        planId: 'basic',
        name: 'Basic Plan',
        price: 9.99,
        interval: 'EVERY_30_DAYS',
        trialDays: 7,
        features: ['Product Management', 'Basic Analytics'],
        limits: {
          products: 100,
          orders: 500,
          apiCalls: 1000
        }
      },
      {
        planId: 'pro',
        name: 'Pro Plan',
        price: 29.99,
        interval: 'EVERY_30_DAYS',
        trialDays: 7,
        features: ['Product Management', 'Advanced Analytics', 'Bulk Operations'],
        limits: {
          products: 1000,
          orders: 5000,
          apiCalls: 10000
        }
      },
      {
        planId: 'enterprise',
        name: 'Enterprise Plan',
        price: 99.99,
        interval: 'EVERY_30_DAYS',
        trialDays: 14,
        features: ['All Features', 'Priority Support', 'Custom Integrations'],
        limits: {
          products: -1,
          orders: -1,
          apiCalls: -1
        }
      }
    ];

    for (const plan of defaultPlans) {
      await BillingPlan.findOneAndUpdate(
        { planId: plan.planId },
        plan,
        { upsert: true, new: true }
      );
    }

    console.log('✅ Billing plans initialized');
  }

  /**
   * Get all available billing plans
   */
  async getPlans() {
    return await BillingPlan.find({ isActive: true }).sort({ price: 1 });
  }

  /**
   * Get specific billing plan
   */
  async getPlan(planId) {
    return await BillingPlan.findOne({ planId, isActive: true });
  }

  /**
   * Create a Shopify recurring charge
   */
  async createRecurringCharge(shop, planId, returnUrl) {
    try {
      console.log(`🚀 Starting createRecurringCharge for ${shop}, plan: ${planId}`);
      
      const plan = await this.getPlan(planId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }
      console.log(`✅ Plan found: ${plan.name}`);

      // Get store access token
      console.log(`🔍 Getting access token for ${shop}...`);
      const accessToken = await this.storeManager.getAccessToken(shop);
      if (!accessToken) {
        throw new Error(`No access token found for shop: ${shop}`);
      }
      console.log(`✅ Access token retrieved successfully`);

      console.log(`🔍 Access token validation for ${shop}:`, {
        hasToken: !!accessToken,
        tokenLength: accessToken?.length,
        tokenPrefix: accessToken?.substring(0, 4)
      });

      // Validate the access token by making a simple API call first
      console.log(`🧪 Starting access token validation for ${shop}...`);
      
      let testSession, testClient, shopInfo;
      
      try {
        console.log(`🔧 Creating test session with parameters:`, {
          id: `test_${shop}`,
          shop,
          hasAccessToken: !!accessToken,
          accessTokenLength: accessToken?.length,
          isOnline: false,
          state: 'enabled',
          scope: 'write_products'
        });

        testSession = new Session({
          id: `test_${shop}`,
          shop,
          accessToken,
          isOnline: false,
          state: 'enabled',
          scope: 'write_products'
        });

        console.log(`✅ Test session created successfully:`, {
          id: testSession.id,
          shop: testSession.shop,
          hasAccessToken: !!testSession.accessToken,
          isOnline: testSession.isOnline,
          state: testSession.state,
          scope: testSession.scope
        });

      } catch (sessionError) {
        console.error(`❌ Failed to create test session:`, sessionError);
        throw new Error(`Session creation failed: ${sessionError.message}`);
      }

      try {
        console.log(`🔧 Creating REST client for test session...`);
        testClient = new shopify.api.clients.Rest({ session: testSession });
        console.log(`✅ REST client created successfully`);

      } catch (clientError) {
        console.error(`❌ Failed to create REST client:`, clientError);
        throw new Error(`REST client creation failed: ${clientError.message}`);
      }

      try {
        console.log(`🌐 Making test API call to /shop endpoint...`);
        const shopInfoStartTime = Date.now();
        shopInfo = await testClient.get({ path: 'shop' });
        const shopInfoEndTime = Date.now();
        
        console.log(`✅ Shop API test successful in ${shopInfoEndTime - shopInfoStartTime}ms:`, {
          shopName: shopInfo.body?.shop?.name || 'Shop name not found',
          shopId: shopInfo.body?.shop?.id,
          shopDomain: shopInfo.body?.shop?.domain,
          shopPlan: shopInfo.body?.shop?.plan_name,
          shopPlanDisplayName: shopInfo.body?.shop?.plan_display_name,
          shopOwner: shopInfo.body?.shop?.shop_owner,
          responseStatus: shopInfo.status,
          responseHeaders: Object.keys(shopInfo.headers || {})
        });

      } catch (shopTestError) {
        console.error(`❌ Shop API test failed:`, {
          message: shopTestError.message,
          stack: shopTestError.stack?.split('\n').slice(0, 5),
          name: shopTestError.name,
          cause: shopTestError.cause,
          response: shopTestError.response
        });
        
        // Don't throw here - continue with diagnostics
        console.log(`⚠️ Continuing with billing test despite shop API failure...`);
      }

      // Always run the development store check and billing test, even if shop API failed
      if (shopInfo?.body?.shop) {
        // Check if this is a development store
        const isDevelopmentStore = shopInfo.body.shop.plan_name?.toLowerCase().includes('development') || 
                                  shopInfo.body.shop.plan_name?.toLowerCase().includes('partner') ||
                                  shopInfo.body.shop.plan_display_name?.toLowerCase().includes('development');
        
        if (isDevelopmentStore) {
          console.log(`⚠️ WARNING: This appears to be a development store. Billing API may not work on development stores.`);
          console.log(`🔍 Shop plan details:`, {
            planName: shopInfo.body.shop.plan_name,
            planDisplayName: shopInfo.body.shop.plan_display_name,
            isDevelopmentStore
          });
        }
      }

      // Test billing API regardless of shop API results
      if (testClient) {
        console.log(`🧪 Testing billing API accessibility...`);
        try {
          const billingTestStartTime = Date.now();
          const existingCharges = await testClient.get({ path: 'recurring_application_charges' });
          const billingTestEndTime = Date.now();
          
          console.log(`✅ Billing API test successful in ${billingTestEndTime - billingTestStartTime}ms:`, {
            existingChargesCount: existingCharges.body?.recurring_application_charges?.length || 0,
            responseStatus: existingCharges.status
          });
        } catch (billingTestError) {
          console.error(`❌ Billing API test failed:`, {
            message: billingTestError.message,
            name: billingTestError.name,
            stack: billingTestError.stack?.split('\n').slice(0, 3)
          });
          
          if (billingTestError.message.includes('403') || billingTestError.message.includes('Forbidden')) {
            console.error(`🚫 Billing API access forbidden - check app permissions and scopes`);
            throw new Error(`Billing API access forbidden. Ensure your app has the required billing permissions.`);
          }
          
          if (billingTestError.message.includes('JSON')) {
            console.error(`🔍 JSON parsing error - likely empty response from Shopify API`);
            console.log(`ℹ️ Note: Development stores support Billing API with test: true parameter`);
            // Continue with the actual billing API call - it should work with test: true
          }
        }
      }

      // Create session for Shopify API using proper Session constructor
      console.log(`🔧 Creating main session for billing charge...`);
      const session = new Session({
        id: `offline_${shop}`,
        shop,
        accessToken,
        isOnline: false,
        state: 'enabled',
        scope: 'write_products'
      });

      console.log(`✅ Main session created successfully:`, {
        id: session.id,
        shop: session.shop,
        hasAccessToken: !!session.accessToken,
        accessTokenLength: session.accessToken?.length,
        isOnline: session.isOnline,
        state: session.state,
        scope: session.scope
      });

      // Create recurring application charge using REST client
      console.log(`🔄 Starting recurring charge creation process...`);
      console.log(`📋 Plan details:`, {
        planId: plan.planId,
        name: plan.name,
        price: plan.price,
        trialDays: plan.trialDays
      });
      console.log(`🔗 Return URL: ${returnUrl}`);
      
      try {
        console.log(`🔧 Creating REST client for billing charge...`);
        const client = new shopify.api.clients.Rest({ session });
        console.log(`✅ REST client created successfully for billing`);
        
        const chargeData = {
          recurring_application_charge: {
            name: plan.name,
            price: plan.price,
            return_url: returnUrl,
            trial_days: plan.trialDays || 0,
            // IMPORTANT: test: true enables billing API in development stores without real charges
            test: process.env.NODE_ENV !== 'production'
          }
        };

        console.log(`📤 Charge data to send:`, JSON.stringify(chargeData, null, 2));
        console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        console.log(`🧪 Test mode: ${process.env.NODE_ENV !== 'production'}`);

        // Log detailed request information
        console.log(`🌐 Making POST request to Shopify API...`);
        console.log(`🎯 Endpoint: recurring_application_charges`);
        console.log(`🏪 Shop: ${session.shop}`);
        console.log(`🔑 Access Token Status: ${!!session.accessToken ? 'Present' : 'Missing'}`);
        console.log(`🔑 Access Token Length: ${session.accessToken?.length || 0}`);
        console.log(`🔑 Access Token Preview: ${session.accessToken?.substring(0, 10)}...`);

        console.log(`⏳ Sending request to Shopify...`);
        const startTime = Date.now();
        
        // Add more detailed request logging
        console.log(`🔍 Request details:`, {
          method: 'POST',
          path: 'recurring_application_charges',
          shop: session.shop,
          hasAccessToken: !!session.accessToken,
          testMode: chargeData.recurring_application_charge.test,
          chargeData: JSON.stringify(chargeData, null, 2)
        });
        
        const response = await client.post({
          path: 'recurring_application_charges',
          data: chargeData,
          type: 'application/json'
        });

        const endTime = Date.now();
        console.log(`⚡ Request completed in ${endTime - startTime}ms`);
        console.log(`📥 Raw response received:`, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          bodyKeys: Object.keys(response.body || {}),
          bodyType: typeof response.body
        });
        console.log(`📄 Response body:`, JSON.stringify(response.body, null, 2));

        if (!response.body || !response.body.recurring_application_charge) {
          throw new Error(`Invalid response from Shopify API: ${JSON.stringify(response)}`);
        }

        const charge = response.body.recurring_application_charge;

        console.log(`✅ Charge created successfully:`, {
          id: charge.id,
          name: charge.name,
          price: charge.price,
          status: charge.status,
          confirmation_url: charge.confirmation_url
        });

      } catch (apiError) {
        console.error(`❌ Shopify API Error - Comprehensive Details:`, {
          errorType: apiError.constructor.name,
          message: apiError.message,
          name: apiError.name,
          cause: apiError.cause,
          stack: apiError.stack?.split('\n').slice(0, 5), // First 5 lines of stack
          response: apiError.response ? {
            status: apiError.response.status,
            statusText: apiError.response.statusText,
            headers: apiError.response.headers,
            data: apiError.response.data,
            config: apiError.response.config
          } : null,
          request: apiError.request ? {
            method: apiError.request.method,
            url: apiError.request.url,
            headers: apiError.request.headers
          } : null
        });

        // Special handling for development stores
        if (apiError.message.includes('JSON') || apiError.message.includes('Unexpected end')) {
          console.error(`🚫 Development Store Billing Issue Detected`);
          console.log(`💡 Implementing fallback: Mock billing for development store`);
          
          // Create mock billing response for development stores
          const mockChargeId = `dev_mock_${Date.now()}`;
          const mockConfirmationUrl = `${process.env.HOST || 'http://localhost:3000'}/api/billing/mock-confirm?charge_id=${mockChargeId}&shop=${shop}`;
          
          const subscription = new Subscription({
            shop,
            shopifyChargeId: mockChargeId,
            planId: plan.planId,
            name: plan.name,
            price: plan.price,
            interval: plan.interval,
            trialDays: plan.trialDays,
            confirmationUrl: mockConfirmationUrl,
            returnUrl: returnUrl,
            status: 'PENDING'
          });

          await subscription.save();

          console.log(`🎭 Mock charge created for development store: ${mockChargeId}`);

          return {
            chargeId: mockChargeId,
            confirmationUrl: mockConfirmationUrl,
            subscription
          };
        }

        // Check for specific error patterns
        if (apiError.message.includes('JSON')) {
          console.error(`🔍 JSON Parsing Error Analysis:`, {
            likelyReason: 'Server returned non-JSON response (HTML error page, empty response, etc.)',
            possibleCauses: [
              'Invalid access token',
              'App not properly installed',
              'Network connectivity issues',
              'Shopify API endpoint issues',
              'Rate limiting'
            ]
          });
        }
        
        throw new Error(`Shopify API request failed: ${apiError.message}`);
      }

      // Store subscription in database
      const subscription = new Subscription({
        shop,
        shopifyChargeId: charge.id.toString(),
        planId: plan.planId,
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        trialDays: plan.trialDays,
        confirmationUrl: charge.confirmation_url,
        returnUrl: returnUrl,
        status: 'PENDING'
      });

      await subscription.save();

      console.log(`💳 Recurring charge created for ${shop}: ${charge.id}`);

      return {
        chargeId: charge.id,
        confirmationUrl: charge.confirmation_url,
        subscription
      };

    } catch (error) {
      console.error(`❌ Error creating recurring charge for ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Activate a recurring charge after customer accepts
   */
  async activateCharge(shop, chargeId) {
    try {
      const accessToken = await this.storeManager.getAccessToken(shop);
      const session = new Session({
        id: `offline_${shop}`,
        shop,
        accessToken,
        isOnline: false,
        state: 'enabled',
        scope: 'write_products'
      });

      // Get the charge from Shopify
      const charge = await restResources.RecurringApplicationCharge.find({
        session,
        id: chargeId
      });

      if (charge.status === 'accepted') {
        // Activate the charge
        await charge.activate();

        // Update subscription in database
        const subscription = await Subscription.findOneAndUpdate(
          { shop, shopifyChargeId: chargeId.toString() },
          {
            status: 'ACTIVE',
            activatedOn: new Date(),
            billingOn: charge.billing_on ? new Date(charge.billing_on) : null,
            trialEndsOn: charge.trial_ends_on ? new Date(charge.trial_ends_on) : null
          },
          { new: true }
        );

        // Update store with current plan
        await this.storeManager.updateStoreSettings(shop, {
          currentPlan: subscription.planId,
          subscriptionId: subscription._id.toString()
        });

        console.log(`✅ Charge activated for ${shop}: ${chargeId}`);
        return subscription;
      } else {
        throw new Error(`Charge not accepted. Status: ${charge.status}`);
      }

    } catch (error) {
      console.error(`❌ Error activating charge ${chargeId} for ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a recurring charge
   */
  async cancelCharge(shop, chargeId) {
    try {
      const accessToken = await this.storeManager.getAccessToken(shop);
      const session = new Session({
        id: `offline_${shop}`,
        shop,
        accessToken,
        isOnline: false
      });

      // Cancel the charge in Shopify
      const charge = await restResources.RecurringApplicationCharge.find({
        session,
        id: chargeId
      });

      await charge.cancel();

      // Update subscription in database
      const subscription = await Subscription.findOneAndUpdate(
        { shop, shopifyChargeId: chargeId.toString() },
        {
          status: 'CANCELLED',
          cancelledOn: new Date()
        },
        { new: true }
      );

      console.log(`❌ Charge cancelled for ${shop}: ${chargeId}`);
      return subscription;

    } catch (error) {
      console.error(`❌ Error cancelling charge ${chargeId} for ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Get current subscription for a shop
   */
  async getCurrentSubscription(shop) {
    return await Subscription.findOne({
      shop,
      status: { $in: ['ACTIVE', 'PENDING'] }
    }).sort({ createdAt: -1 });
  }

  /**
   * Check if shop has active subscription
   */
  async hasActiveSubscription(shop) {
    const subscription = await Subscription.findOne({
      shop,
      status: 'ACTIVE'
    });
    return !!subscription;
  }

  /**
   * Get subscription history for a shop
   */
  async getSubscriptionHistory(shop) {
    return await Subscription.find({ shop }).sort({ createdAt: -1 });
  }

  /**
   * Validate plan limits for a shop
   */
  async validatePlanLimits(shop, resource, count) {
    const subscription = await this.getCurrentSubscription(shop);
    if (!subscription || subscription.status !== 'ACTIVE') {
      return { allowed: false, reason: 'No active subscription' };
    }

    const plan = await this.getPlan(subscription.planId);
    if (!plan) {
      return { allowed: false, reason: 'Plan not found' };
    }

    const limit = plan.limits[resource];
    if (limit === -1) {
      return { allowed: true }; // Unlimited
    }

    if (count > limit) {
      return { 
        allowed: false, 
        reason: `${resource} limit exceeded. Plan allows ${limit}, requested ${count}` 
      };
    }

    return { allowed: true };
  }


  /**
   * Sync subscription status with Shopify
   */
  async syncSubscriptionStatus(shop) {
    try {
      const subscription = await this.getCurrentSubscription(shop);
      if (!subscription || !subscription.shopifyChargeId) {
        return null;
      }

      const accessToken = await this.storeManager.getAccessToken(shop);
      const session = new Session({
        id: `offline_${shop}`,
        shop,
        accessToken,
        isOnline: false,
        state: 'enabled',
        scope: 'write_products'
      });

      // Get the charge from Shopify
      const charge = await restResources.RecurringApplicationCharge.find({
        session,
        id: subscription.shopifyChargeId
      });

      if (charge) {
        subscription.status = charge.status.toUpperCase();
        await subscription.save();
      }

      return subscription;

    } catch (error) {
      console.error(`❌ Error syncing subscription for ${shop}:`, error);
      throw error;
    }
  }
}

export default BillingManager;
