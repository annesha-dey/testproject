import express from "express";
import { validateSession } from "../middleware/auth.js";
import StoreManager from "../utils/storeManager.js";
import sessionHandler from "../utils/sessionHandler.js";
import shopify from "../config/shopify.js";

const router = express.Router();
const storeManager = new StoreManager();

/**
 * POST /api/auth/logout
 * Logout endpoint that cleans up sessions and store data
 */
router.post("/logout", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    const session = req.session;

    console.log(`🔄 Processing logout for shop: ${shop}`);

    // 1. Delete all sessions for this shop from Shopify session storage
    const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
    
    if (sessions && sessions.length > 0) {
      for (const sessionToDelete of sessions) {
        await shopify.config.sessionStorage.deleteSession(sessionToDelete.id);
        console.log(`🗑️ Deleted Shopify session: ${sessionToDelete.id}`);
      }
    }

    // 2. Delete sessions from our custom session handler
    if (session && session.id) {
      await sessionHandler.deleteSession(session.id);
      console.log(`🗑️ Deleted custom session: ${session.id}`);
    }

    // 3. Deactivate the store (mark as inactive but don't delete)
    await storeManager.deactivateStore(shop);
    console.log(`🔒 Deactivated store: ${shop}`);

    // 4. Clear any cached data or temporary tokens
    // This is where you'd clear any additional cached data if needed

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

/**
 * GET /api/auth/session-status
 * Check if the current session is valid
 */
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

export default router;
