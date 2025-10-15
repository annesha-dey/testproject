/**
 * Analytics Routes for Profit Analyser
 */

import express from "express";
import { validateSession } from "../../../../core/auth/index.js";
import AnalyticsController from "../controllers/AnalyticsController.js";

const router = express.Router();
const analyticsController = new AnalyticsController();

// Test endpoint to verify route is working
router.get("/test", (req, res) => {
  console.log("🧪 [ANALYTICS] Test endpoint hit");
  res.json({ 
    success: true, 
    message: "Analytics route is working",
    timestamp: new Date().toISOString()
  });
});

// Get profit dashboard data
router.get("/dashboard", validateSession, async (req, res) => {
  try {
    console.log("🔍 [DASHBOARD] Route hit with query:", req.query);
    console.log("🔍 [DASHBOARD] Headers:", Object.keys(req.headers));
    console.log("🔍 [DASHBOARD] Method:", req.method);
    console.log("🔍 [DASHBOARD] URL:", req.url);
    
    const { shop } = req.query;
    
    if (!shop) {
      console.error("❌ [DASHBOARD] No shop parameter provided");
      return res.status(400).json({ success: false, error: "Shop parameter is required" });
    }
    
    console.log(`🔄 [DASHBOARD] Fetching dashboard data for shop: ${shop}`);
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json');
    
    const dashboardData = await analyticsController.getDashboardData(shop, req.query);
    
    console.log("🔍 [DASHBOARD] Dashboard data retrieved successfully");
    const response = { success: true, data: dashboardData };
    
    res.json(response);
  } catch (error) {
    console.error("❌ [DASHBOARD] Error fetching dashboard data:", error);
    console.error("❌ [DASHBOARD] Stack trace:", error.stack);
    
    // Ensure we return JSON even on error
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get profit trends
router.get("/trends", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    const trends = await analyticsController.getProfitTrends(shop, req.query);
    res.json({ success: true, trends });
  } catch (error) {
    console.error("Error fetching profit trends:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top performing products
router.get("/top-products", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    const topProducts = await analyticsController.getTopPerformingProducts(shop, req.query);
    res.json({ success: true, products: topProducts });
  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
