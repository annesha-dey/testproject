/**
 * Core Authentication Module
 * Handles Shopify OAuth flow, session management, and authentication middleware
 */

import express from "express";
import shopify from "../utils/shopify.js";
import StoreManager from "../utils/storeManager.js";
import sessionHandler from "../utils/sessionHandler.js";

const router = express.Router();
const storeManager = new StoreManager();

/**
 * Initialize OAuth routes
 * @param {Express} app - Express application instance
 * @param {Object} options - Configuration options
 */
export const initializeAuth = (app, options = {}) => {
  const {
    onAuthSuccess = () => {},
    onAuthError = () => {},
    redirectUrl = process.env.VITE_SHOPIFY_APP_URL || process.env.SHOPIFY_APP_URL
  } = options;

  // OAuth initiation
  app.get(shopify.config.auth.path, shopify.auth.begin());

  // OAuth callback
  app.get(
    shopify.config.auth.callbackPath,
    shopify.auth.callback(),
    async (req, res) => {
      const { shop } = res.locals.shopify.session;
      
      try {
        // Handle reinstallation properly
        const isReinstallation = await storeManager.handleReinstallation(shop);
        
        if (isReinstallation) {
          console.log(`🔄 App reinstallation completed for: ${shop}`);
        } else {
          console.log(`🆕 New app installation for: ${shop}`);
        }

        // Store fresh shop data
        await storeManager.storeShopData(res.locals.shopify.session);
        console.log(`🎉 OAuth completed and store data saved for: ${shop}`);

        // Trigger Day 1 data fetch for new installations
        if (!isReinstallation) {
          console.log(`🚀 [OAUTH] Triggering Day 1 data fetch for new installation: ${shop}`);
          console.log(`🔍 [OAUTH] Session details:`, {
            shop: res.locals.shopify.session.shop,
            hasAccessToken: !!res.locals.shopify.session.accessToken,
            scope: res.locals.shopify.session.scope
          });
          
          // Import and schedule Day 1 data fetch with delay
          setTimeout(async () => {
            try {
              console.log(`🔄 [OAUTH] Starting Day 1 data fetch job for ${shop}...`);
              const { executeDay1DataFetch } = await import('../jobs/day1DataFetchJob.js');
              const result = await executeDay1DataFetch(shop, {
                trigger: 'oauth_completion',
                session: res.locals.shopify.session
              });
              console.log(`✅ [OAUTH] Day 1 data fetch completed:`, result);
            } catch (error) {
              console.error(`❌ [OAUTH] Failed to execute Day 1 data fetch for ${shop}:`, error);
              console.error(`❌ [OAUTH] Error stack:`, error.stack);
            }
          }, 10000); // 10 second delay to ensure OAuth is fully complete
        } else {
          console.log(`ℹ️ [OAUTH] Skipping Day 1 data fetch for reinstallation: ${shop}`);
        }

        // Call success callback
        await onAuthSuccess(shop, res.locals.shopify.session);

        // Redirect to frontend
        res.redirect(`${redirectUrl}/home?shop=${shop}`);
      } catch (error) {
        console.error(`❌ Error handling OAuth for ${shop}:`, error);
        await onAuthError(error, shop);
        
        // Continue with redirect even if there's an error
        res.redirect(`${redirectUrl}/home?shop=${shop}`);
      }
    }
  );

  console.log('✅ Core Auth module initialized');
};

/**
 * Middleware to validate authenticated session for API routes
 */
export const validateSession = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    
    console.log('🔍 Validating session for shop:', shop);
    
    if (!shop) {
      console.log('❌ No shop parameter provided');
      return res.status(401).json({ error: 'Shop parameter is required' });
    }

    // Get store data and validate access token
    const store = await storeManager.getStore(shop);
    
    if (!store) {
      console.log('❌ No active store found for:', shop);
      return res.status(401).json({ error: 'No active store found for this shop' });
    }

    console.log('✅ Store found:', store.shop);

    // Get the session for this shop
    const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
    
    console.log('📋 Sessions found:', sessions?.length || 0);
    
    if (!sessions || sessions.length === 0) {
      console.log('❌ No valid session found for:', shop);
      return res.status(401).json({ error: 'No valid session found for this shop' });
    }

    const session = sessions[0];
    console.log('✅ Using session:', session.id);

    // Add both session and store data to the request
    req.session = session;
    req.store = store;
    res.locals.shopify = { session };
    res.locals.store = store;
    
    console.log('✅ Session validation successful for:', shop);
    next();
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Auth API routes
 */
export const authRoutes = () => {
  const router = express.Router();

  // Logout endpoint
  router.post("/logout", validateSession, async (req, res) => {
    try {
      const { shop } = req.query;
      const session = req.session;

      console.log(`🔄 Processing logout for shop: ${shop}`);

      // Delete all sessions for this shop from Shopify session storage
      const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
      
      if (sessions && sessions.length > 0) {
        for (const sessionToDelete of sessions) {
          await shopify.config.sessionStorage.deleteSession(sessionToDelete.id);
          console.log(`🗑️ Deleted Shopify session: ${sessionToDelete.id}`);
        }
      }

      // Delete sessions from our custom session handler
      if (session && session.id) {
        await sessionHandler.deleteSession(session.id);
        console.log(`🗑️ Deleted custom session: ${session.id}`);
      }

      // Deactivate the store
      await storeManager.deactivateStore(shop);
      console.log(`🔒 Deactivated store: ${shop}`);

      console.log(`✅ Logout completed successfully for shop: ${shop}`);

      res.json({
        success: true,
        message: "Logout successful",
        shop: shop
      });

    } catch (error) {
      console.error(`❌ Logout error for shop ${req.query.shop}:`, error);
      res.status(500).json({
        success: false,
        error: "Logout failed",
        message: error.message
      });
    }
  });

  // Session status check
  router.get("/session-status", async (req, res) => {
    try {
      const { shop } = req.query;

      if (!shop) {
        return res.json({
          authenticated: false,
          error: "Shop parameter required"
        });
      }

      // Check if store exists and is active
      const store = await storeManager.getStore(shop);
      
      if (!store) {
        return res.json({
          authenticated: false,
          error: "Store not found"
        });
      }

      // Check if sessions exist
      const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
      
      if (!sessions || sessions.length === 0) {
        return res.json({
          authenticated: false,
          error: "No valid session found"
        });
      }

      res.json({
        authenticated: true,
        shop: shop,
        sessionCount: sessions.length
      });

    } catch (error) {
      console.error(`❌ Session status check error:`, error);
      res.json({
        authenticated: false,
        error: "Session check failed"
      });
    }
  });

  return router;
};

export { storeManager };

export default {
  initializeAuth,
  validateSession,
  authRoutes,
  storeManager
};
