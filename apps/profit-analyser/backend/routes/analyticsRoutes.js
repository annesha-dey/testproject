/**
 * Analytics Routes for Profit Analyser
 */

import express from "express";
import { validateSession } from "../../../../core/auth/index.js";
import AnalyticsController from "../controllers/AnalyticsController.js";

const router = express.Router();
const analyticsController = new AnalyticsController();

// Get profit dashboard data
router.get("/dashboard", validateSession, async (req, res) => {
  try {
    console.log("🔍 [DASHBOARD] Route hit with query:", req.query);
    console.log("🔍 [DASHBOARD] Headers:", req.headers);
    console.log("🔍 [DASHBOARD] Session info:", req.session);
    
    const { shop } = req.query;
    
    if (!shop) {
      console.error("❌ [DASHBOARD] No shop parameter provided");
      return res.status(400).json({ success: false, error: "Shop parameter is required" });
    }
    
    console.log(`🔄 [DASHBOARD] Fetching dashboard data for shop: ${shop}`);
    const dashboardData = await analyticsController.getDashboardData(shop, req.query);
    
    console.log("🔍 [DASHBOARD] Dashboard data retrieved:", dashboardData);
    const response = { success: true, data: dashboardData };
    console.log("🔍 [DASHBOARD] Sending response:", response);
    
    res.json(response);
  } catch (error) {
    console.error("❌ [DASHBOARD] Error fetching dashboard data:", error);
    console.error("❌ [DASHBOARD] Stack trace:", error.stack);
    res.status(500).json({ success: false, error: error.message });
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
