/**
 * Core Webhooks Module
 * Handles Shopify webhook registration, processing, and management
 */

import express from "express";
import shopify from "../utils/shopify.js";
import StoreManager from "../utils/storeManager.js";

const storeManager = new StoreManager();

/**
 * Default webhook handlers for core functionality
 */
export const defaultWebhookHandlers = {
  /**
   * Handle app uninstall
   */
  APP_UNINSTALLED: {
    deliveryMethod: "http",
    callbackUrl: "/api/webhooks/app/uninstalled",
    callback: async (topic, shop, body, webhookId) => {
      console.log(`🔄 Processing app uninstall for shop: ${shop}`);
      console.log(`🔍 Webhook details - Topic: ${topic}, Shop: ${shop}, Body type: ${typeof body}, Body length: ${body ? body.length : 0}`);
      
      try {
        // Parse webhook body (handle empty/null body gracefully)
        let webhookData = {};
        if (body) {
          try {
            webhookData = typeof body === 'string' ? JSON.parse(body) : body;
            console.log(`✅ Webhook body parsed successfully:`, webhookData);
          } catch (e) {
            console.warn(`⚠️ Could not parse webhook body for ${shop}:`, e.message);
            console.warn(`⚠️ Raw body:`, body);
          }
        } else {
          console.warn(`⚠️ Empty webhook body received for ${shop} - proceeding with cleanup anyway`);
        }
        
        // Import and use the comprehensive uninstallation handler
        const { handleAppUninstallation } = await import('./appInstallationHandler.js');
        
        // Execute comprehensive cleanup (even with empty body)
        console.log(`🔄 Triggering comprehensive cleanup for ${shop}...`);
        await handleAppUninstallation(shop, webhookData);
        
        console.log(`✅ Comprehensive app uninstall processed for shop: ${shop}`);
      } catch (error) {
        console.error(`❌ Error processing app uninstall for ${shop}:`, error);
        console.error(`❌ Error stack:`, error.stack);
        
        // Even if there's an error, try to at least deactivate the store
        try {
          await storeManager.deactivateStore(shop);
          console.log(`✅ Fallback: Store deactivated for ${shop}`);
        } catch (fallbackError) {
          console.error(`❌ Fallback deactivation also failed for ${shop}:`, fallbackError);
        }
      }
    }
  },

  /**
   * Handle GDPR customer data request
   */
  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: "http",
    callbackUrl: "/api/webhooks/customers/data_request",
    callback: async (topic, shop, body, webhookId) => {
      console.log(`🔄 Processing customer data request for shop: ${shop}`);
      
      try {
        const payload = JSON.parse(body);
        const customerId = payload.customer.id;
        
        // Log the request for compliance
        console.log(`📋 Customer data request logged:`, {
          shop,
          customerId,
          requestId: payload.data_request?.id,
          timestamp: new Date().toISOString()
        });
        
        // Here you would typically:
        // 1. Collect all customer data from your database
        // 2. Generate a report
        // 3. Send it to the customer or store it for pickup
        
        console.log(`✅ Customer data request processed for shop: ${shop}`);
      } catch (error) {
        console.error(`❌ Error processing customer data request for ${shop}:`, error);
      }
    }
  },

  /**
   * Handle GDPR customer redact request
   */
  CUSTOMERS_REDACT: {
    deliveryMethod: "http",
    callbackUrl: "/api/webhooks/customers/redact",
    callback: async (topic, shop, body, webhookId) => {
      console.log(`🔄 Processing customer redact request for shop: ${shop}`);
      
      try {
        const payload = JSON.parse(body);
        const customerId = payload.customer.id;
        
        // Log the redaction request
        console.log(`🗑️ Customer redaction request logged:`, {
          shop,
          customerId,
          timestamp: new Date().toISOString()
        });
        
        // Here you would typically:
        // 1. Remove or anonymize customer data from your database
        // 2. Log the redaction for compliance
        
        console.log(`✅ Customer redaction processed for shop: ${shop}`);
      } catch (error) {
        console.error(`❌ Error processing customer redaction for ${shop}:`, error);
      }
    }
  },

  /**
   * Handle GDPR shop redact request
   */
  SHOP_REDACT: {
    deliveryMethod: "http",
    callbackUrl: "/api/webhooks/shop/redact",
    callback: async (topic, shop, body, webhookId) => {
      console.log(`🔄 Processing shop redact request for shop: ${shop}`);
      
      try {
        // Log the shop redaction request
        console.log(`🗑️ Shop redaction request logged:`, {
          shop,
          timestamp: new Date().toISOString()
        });
        
        // Here you would typically:
        // 1. Remove all shop data from your database
        // 2. Clean up any associated resources
        // 3. Log the redaction for compliance
        
        // Deactivate the store
        await storeManager.deactivateStore(shop);
        
        console.log(`✅ Shop redaction processed for shop: ${shop}`);
      } catch (error) {
        console.error(`❌ Error processing shop redaction for ${shop}:`, error);
      }
    }
  }
};

/**
 * Webhook Manager Class
 */
export class WebhookManager {
  constructor() {
    this.handlers = { ...defaultWebhookHandlers };
  }

  /**
   * Register additional webhook handlers
   */
  registerHandler(topic, handler) {
    this.handlers[topic] = handler;
    console.log(`✅ Webhook handler registered for topic: ${topic}`);
  }

  /**
   * Register multiple handlers
   */
  registerHandlers(handlers) {
    Object.entries(handlers).forEach(([topic, handler]) => {
      this.registerHandler(topic, handler);
    });
  }

  /**
   * Get all registered handlers
   */
  getHandlers() {
    return this.handlers;
  }

  /**
   * Initialize webhook processing with Express app
   */
  initializeWebhooks(app) {
    app.post(
      shopify.config.webhooks.path,
      shopify.processWebhooks({ webhookHandlers: this.handlers })
    );
    
    console.log('✅ Core Webhooks module initialized');
  }

  /**
   * Create webhook routes for manual webhook endpoints
   */
  createWebhookRoutes() {
    const router = express.Router();

    // Manual webhook endpoints (for testing or custom processing)
    router.post('/app/uninstalled', async (req, res) => {
      try {
        const shop = req.get('X-Shopify-Shop-Domain');
        await this.handlers.APP_UNINSTALLED.callback('APP_UNINSTALLED', shop, JSON.stringify(req.body));
        res.status(200).send('OK');
      } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Error');
      }
    });

    router.post('/customers/data_request', async (req, res) => {
      try {
        const shop = req.get('X-Shopify-Shop-Domain');
        await this.handlers.CUSTOMERS_DATA_REQUEST.callback('CUSTOMERS_DATA_REQUEST', shop, JSON.stringify(req.body));
        res.status(200).send('OK');
      } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Error');
      }
    });

    router.post('/customers/redact', async (req, res) => {
      try {
        const shop = req.get('X-Shopify-Shop-Domain');
        await this.handlers.CUSTOMERS_REDACT.callback('CUSTOMERS_REDACT', shop, JSON.stringify(req.body));
        res.status(200).send('OK');
      } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Error');
      }
    });

    router.post('/shop/redact', async (req, res) => {
      try {
        const shop = req.get('X-Shopify-Shop-Domain');
        await this.handlers.SHOP_REDACT.callback('SHOP_REDACT', shop, JSON.stringify(req.body));
        res.status(200).send('OK');
      } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Error');
      }
    });

    return router;
  }
}

export default {
  WebhookManager,
  defaultWebhookHandlers
};
