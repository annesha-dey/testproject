/**
 * Core Billing Module
 * Handles Shopify billing, subscriptions, and payment processing
 */

import express from "express";
import { Session } from "@shopify/shopify-api";
import shopify from "../utils/shopify.js";
import StoreManager from "../utils/storeManager.js";
import BillingPlan from "../db/models/BillingPlan.js";
import BillingSubscription from "../db/models/BillingSubscription.js";

const storeManager = new StoreManager();

/**
 * Billing Manager Class
 */
export class BillingManager {
  constructor(shopifyApi) {
    this.shopifyApi = shopifyApi;
  }

  /**
   * Initialize default billing plans
   */
  async initializePlans() {
    try {
      console.log('🔄 Initializing billing plans...');
      
      const defaultPlans = [
        {
          planId: 'basic',
          name: 'Basic Plan',
          price: 9.99,
          interval: 'EVERY_30_DAYS',
          trialDays: 7,
          features: [
            'Up to 100 products',
            'Basic analytics',
            'Email support',
            'Standard integrations'
          ],
          limits: {
            products: 100,
            orders: 1000,
            apiCalls: 10000
          },
          isActive: true
        },
        {
          planId: 'pro',
          name: 'Pro Plan',
          price: 29.99,
          interval: 'EVERY_30_DAYS',
          trialDays: 14,
          features: [
            'Up to 1000 products',
            'Advanced analytics',
            'Priority support',
            'Premium integrations',
            'Custom reports'
          ],
          limits: {
            products: 1000,
            orders: 10000,
            apiCalls: 100000
          },
          isActive: true
        },
        {
          planId: 'enterprise',
          name: 'Enterprise Plan',
          price: 99.99,
          interval: 'EVERY_30_DAYS',
          trialDays: 30,
          features: [
            'Unlimited products',
            'Enterprise analytics',
            '24/7 phone support',
            'All integrations',
            'Custom development',
            'Dedicated account manager'
          ],
          limits: {
            products: -1, // Unlimited
            orders: -1,
            apiCalls: -1
          },
          isActive: true
        }
      ];

      for (const planData of defaultPlans) {
        await BillingPlan.findOneAndUpdate(
          { planId: planData.planId },
          planData,
          { upsert: true, new: true }
        );
      }

      console.log('✅ Billing plans initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing billing plans:', error);
      throw error;
    }
  }

  /**
   * Create a Shopify recurring charge
   */
  async createRecurringCharge(shop, planId) {
    try {
      console.log(`🔄 Creating recurring charge for shop: ${shop}, plan: ${planId}`);

      // Get plan details
      const plan = await BillingPlan.findOne({ planId, isActive: true });
      if (!plan) {
        throw new Error(`Plan not found: ${planId}`);
      }

      // Get access token for the shop
      const accessToken = await storeManager.getAccessToken(shop);
      if (!accessToken) {
        throw new Error(`No access token found for shop: ${shop}`);
      }

      // Create session for API call
      const session = new Session({
        id: `${shop}_billing_${Date.now()}`,
        shop: shop,
        accessToken: accessToken,
        isOnline: false,
        state: 'authenticated',
        scope: process.env.SHOPIFY_API_SCOPES || 'read_products,write_products'
      });

      // Check if this is a development store
      const isDevelopmentStore = shop.includes('myshopify.com') && 
                                process.env.NODE_ENV === 'development';

      if (isDevelopmentStore) {
        console.log('🧪 Development store detected - creating mock charge');
        return this.createMockCharge(shop, plan);
      }

      // Create REST client
      const client = new shopify.api.clients.Rest({ session });

      const chargeData = {
        recurring_application_charge: {
          name: plan.name,
          price: plan.price,
          return_url: `${process.env.SHOPIFY_APP_URL}/api/billing/activate?shop=${shop}&plan=${planId}`,
          trial_days: plan.trialDays,
          test: process.env.NODE_ENV !== 'production'
        }
      };

      console.log('📤 Sending charge creation request to Shopify:', {
        shop,
        planName: plan.name,
        price: plan.price,
        trialDays: plan.trialDays
      });

      const response = await client.post({
        path: 'recurring_application_charges',
        data: chargeData,
        type: 'application/json'
      });

      const charge = response.body.recurring_application_charge;
      console.log('✅ Recurring charge created:', {
        id: charge.id,
        status: charge.status,
        confirmationUrl: charge.confirmation_url
      });

      // Store charge in database
      await BillingSubscription.findOneAndUpdate(
        { shop, planId },
        {
          shop,
          planId,
          chargeId: charge.id.toString(),
          status: 'PENDING',
          name: plan.name,
          price: plan.price,
          trialEndsOn: charge.trial_ends_on,
          createdAt: new Date()
        },
        { upsert: true, new: true }
      );

      return {
        success: true,
        chargeId: charge.id,
        confirmationUrl: charge.confirmation_url,
        status: charge.status
      };

    } catch (error) {
      console.error(`❌ Error creating recurring charge for ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Create mock charge for development stores
   */
  async createMockCharge(shop, plan) {
    const mockChargeId = `mock_${Date.now()}`;
    const mockConfirmationUrl = `${process.env.SHOPIFY_APP_URL}/api/billing/activate?shop=${shop}&plan=${plan.planId}&charge_id=${mockChargeId}&mock=true`;

    await BillingSubscription.findOneAndUpdate(
      { shop, planId: plan.planId },
      {
        shop,
        planId: plan.planId,
        chargeId: mockChargeId,
        status: 'PENDING',
        name: plan.name,
        price: plan.price,
        trialEndsOn: new Date(Date.now() + (plan.trialDays * 24 * 60 * 60 * 1000)),
        createdAt: new Date(),
        isMock: true
      },
      { upsert: true, new: true }
    );

    return {
      success: true,
      chargeId: mockChargeId,
      confirmationUrl: mockConfirmationUrl,
      status: 'pending',
      isMock: true
    };
  }

  /**
   * Activate a recurring charge
   */
  async activateCharge(shop, chargeId, isMock = false) {
    try {
      console.log(`🔄 Activating charge: ${chargeId} for shop: ${shop}`);

      if (isMock) {
        console.log('🧪 Activating mock charge');
        await BillingSubscription.findOneAndUpdate(
          { shop, chargeId },
          { 
            status: 'ACTIVE',
            activatedAt: new Date()
          }
        );
        return { success: true, status: 'ACTIVE', isMock: true };
      }

      // Get access token and create session
      const accessToken = await storeManager.getAccessToken(shop);
      const session = new Session({
        id: `${shop}_activate_${Date.now()}`,
        shop: shop,
        accessToken: accessToken,
        isOnline: false,
        state: 'authenticated',
        scope: process.env.SHOPIFY_API_SCOPES || 'read_products,write_products'
      });

      const client = new shopify.api.clients.Rest({ session });

      // Activate the charge
      const response = await client.post({
        path: `recurring_application_charges/${chargeId}/activate`,
        type: 'application/json'
      });

      const charge = response.body.recurring_application_charge;
      console.log('✅ Charge activated:', {
        id: charge.id,
        status: charge.status
      });

      // Update subscription status
      await BillingSubscription.findOneAndUpdate(
        { shop, chargeId: chargeId.toString() },
        { 
          status: 'ACTIVE',
          activatedAt: new Date()
        }
      );

      return {
        success: true,
        status: charge.status,
        activatedAt: new Date()
      };

    } catch (error) {
      console.error(`❌ Error activating charge ${chargeId} for ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Get current subscription for a shop
   */
  async getCurrentSubscription(shop) {
    try {
      const subscription = await BillingSubscription.findOne({ 
        shop, 
        status: 'ACTIVE' 
      }).populate('planId');
      
      return subscription;
    } catch (error) {
      console.error(`❌ Error getting subscription for ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(shop) {
    try {
      console.log(`🔄 Cancelling subscription for shop: ${shop}`);

      const subscription = await BillingSubscription.findOne({ 
        shop, 
        status: 'ACTIVE' 
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      if (subscription.isMock) {
        console.log('🧪 Cancelling mock subscription');
        await BillingSubscription.findOneAndUpdate(
          { shop, status: 'ACTIVE' },
          { 
            status: 'CANCELLED',
            cancelledAt: new Date()
          }
        );
        return { success: true, status: 'CANCELLED', isMock: true };
      }

      // Cancel real Shopify charge
      const accessToken = await storeManager.getAccessToken(shop);
      const session = new Session({
        id: `${shop}_cancel_${Date.now()}`,
        shop: shop,
        accessToken: accessToken,
        isOnline: false,
        state: 'authenticated',
        scope: process.env.SHOPIFY_API_SCOPES || 'read_products,write_products'
      });

      const client = new shopify.api.clients.Rest({ session });

      await client.delete({
        path: `recurring_application_charges/${subscription.chargeId}`
      });

      // Update subscription status
      await BillingSubscription.findOneAndUpdate(
        { shop, status: 'ACTIVE' },
        { 
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      );

      console.log('✅ Subscription cancelled successfully');
      return { success: true, status: 'CANCELLED' };

    } catch (error) {
      console.error(`❌ Error cancelling subscription for ${shop}:`, error);
      throw error;
    }
  }
}

/**
 * Billing API routes
 */
export const billingRoutes = (billingManager) => {
  const router = express.Router();

  // Get available plans
  router.get('/plans', async (req, res) => {
    try {
      const plans = await BillingPlan.find({ isActive: true });
      res.json({ success: true, plans });
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create subscription
  router.post('/subscribe', async (req, res) => {
    try {
      const { shop } = req.query;
      const { planId } = req.body;

      if (!shop || !planId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Shop and planId are required' 
        });
      }

      const result = await billingManager.createRecurringCharge(shop, planId);
      res.json(result);
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Activate subscription
  router.get('/activate', async (req, res) => {
    try {
      const { shop, charge_id, plan, mock } = req.query;

      if (!shop || !charge_id) {
        return res.redirect(`${process.env.VITE_SHOPIFY_APP_URL}/billing?shop=${shop}&billing_error=no_charge_id`);
      }

      const result = await billingManager.activateCharge(shop, charge_id, mock === 'true');
      
      if (result.success) {
        res.redirect(`${process.env.VITE_SHOPIFY_APP_URL}/billing?shop=${shop}&billing_success=true&plan=${plan}`);
      } else {
        res.redirect(`${process.env.VITE_SHOPIFY_APP_URL}/billing?shop=${shop}&billing_error=activation_failed`);
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
      res.redirect(`${process.env.VITE_SHOPIFY_APP_URL}/billing?shop=${shop}&billing_error=activation_failed`);
    }
  });

  // Get current subscription
  router.get('/subscription', async (req, res) => {
    try {
      const { shop } = req.query;
      const subscription = await billingManager.getCurrentSubscription(shop);
      res.json({ success: true, subscription });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Cancel subscription
  router.post('/cancel', async (req, res) => {
    try {
      const { shop } = req.query;
      const result = await billingManager.cancelSubscription(shop);
      res.json(result);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};

export default {
  BillingManager,
  billingRoutes
};
