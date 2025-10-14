/**
 * Store Data Routes for Profit Analyser
 */

import express from "express";
import { validateSession } from "../../../../core/auth/index.js";
import { APIFactory } from "../../../../core/utils/api.js";

const router = express.Router();

// Test store connection
router.get("/test", validateSession, async (req, res) => {
  try {
    console.log("🔍 [STORE TEST] Route hit with query:", req.query);
    console.log("🔍 [STORE TEST] Headers:", req.headers);
    console.log("🔍 [STORE TEST] Session info:", req.session);
    
    const { shop } = req.query;
    
    if (!shop) {
      console.error("❌ [STORE TEST] No shop parameter provided");
      return res.status(400).json({ 
        success: false, 
        error: "Shop parameter is required" 
      });
    }

    console.log(`🔄 [STORE TEST] Testing store connection for: ${shop}`);
    
    // Test basic API connectivity
    const { rest } = await APIFactory.createClients(shop);
    console.log("🔍 [STORE TEST] REST client created successfully");
    
    const shopInfo = await rest.getShop();
    console.log("🔍 [STORE TEST] Shop info retrieved:", shopInfo);
    
    const response = { 
      success: true, 
      shop: shopInfo.name,
      domain: shopInfo.domain,
      connected: true,
      timestamp: new Date().toISOString()
    };
    
    console.log("🔍 [STORE TEST] Sending response:", response);
    res.json(response);
    
  } catch (error) {
    console.error("❌ [STORE TEST] Store connection test failed:", error);
    console.error("❌ [STORE TEST] Stack trace:", error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      connected: false
    });
  }
});

// Get store information
router.get("/info", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ 
        success: false, 
        error: "Shop parameter is required" 
      });
    }

    console.log(`🔄 Getting store info for: ${shop}`);
    
    const { rest } = await APIFactory.createClients(shop);
    const shopInfo = await rest.getShop();
    
    res.json({ 
      success: true, 
      store: {
        name: shopInfo.name,
        domain: shopInfo.domain,
        email: shopInfo.email,
        currency: shopInfo.currency,
        timezone: shopInfo.iana_timezone,
        plan: shopInfo.plan_name,
        country: shopInfo.country_name
      }
    });
    
  } catch (error) {
    console.error("❌ Error getting store info:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
