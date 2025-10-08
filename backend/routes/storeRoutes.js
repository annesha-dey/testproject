import express from "express";
import StoreManager from "../utils/storeManager.js";
import { validateSession } from "../middleware/auth.js";

const router = express.Router();
const storeManager = new StoreManager();

/**
 * Get all active stores
 */
router.get("/", async (req, res) => {
  try {
    const stores = await storeManager.getAllActiveStores();
    res.json({
      success: true,
      stores: stores.map(store => ({
        shop: store.shop,
        shopifyDomain: store.shopifyDomain,
        scope: store.scope,
        isActive: store.isActive,
        installedAt: store.installedAt,
        lastAccessedAt: store.lastAccessedAt,
        plan: store.appMetadata.plan
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get specific store information
 */
router.get("/:shop", validateSession, async (req, res) => {
  try {
    const { shop } = req.params;
    const store = await storeManager.getStore(shop);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found"
      });
    }

    res.json({
      success: true,
      store: {
        shop: store.shop,
        shopifyDomain: store.shopifyDomain,
        scope: store.scope,
        isActive: store.isActive,
        installedAt: store.installedAt,
        lastAccessedAt: store.lastAccessedAt,
        appMetadata: store.appMetadata
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update store settings
 */
router.put("/:shop/settings", validateSession, async (req, res) => {
  try {
    const { shop } = req.params;
    const { settings } = req.body;
    
    const store = await storeManager.updateStoreSettings(shop, settings);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found"
      });
    }

    res.json({
      success: true,
      message: "Settings updated successfully",
      settings: store.appMetadata.settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Deactivate a store
 */
router.delete("/:shop", validateSession, async (req, res) => {
  try {
    const { shop } = req.params;
    const store = await storeManager.deactivateStore(shop);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found"
      });
    }

    res.json({
      success: true,
      message: "Store deactivated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Shopify API client configuration for a store
 */
router.get("/:shop/api-config", validateSession, async (req, res) => {
  try {
    const { shop } = req.params;
    const config = await storeManager.createShopifyClient(shop);
    
    res.json({
      success: true,
      config: {
        shop: config.shop,
        apiVersion: config.apiVersion,
        hasAccessToken: !!config.accessToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
