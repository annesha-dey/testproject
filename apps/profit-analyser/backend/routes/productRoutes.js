/**
 * Product Routes for Profit Analyser
 */

import express from "express";
import { validateSession } from "../../../../core/auth/index.js";
import ProductController from "../controllers/ProductController.js";

const router = express.Router();
const productController = new ProductController();

// Get product count
router.get("/count", validateSession, async (req, res) => {
  try {
    console.log("🔍 [PRODUCT COUNT] Route hit with query:", req.query);
    console.log("🔍 [PRODUCT COUNT] Headers:", req.headers);
    console.log("🔍 [PRODUCT COUNT] Session info:", req.session);
    
    const { shop } = req.query;
    
    if (!shop) {
      console.error("❌ [PRODUCT COUNT] No shop parameter provided");
      return res.status(400).json({ success: false, error: "Shop parameter is required" });
    }
    
    console.log(`🔄 [PRODUCT COUNT] Fetching count for shop: ${shop}`);
    const count = await productController.getProductCount(shop);
    
    console.log(`✅ [PRODUCT COUNT] Count retrieved: ${count}`);
    const response = { success: true, count };
    console.log("🔍 [PRODUCT COUNT] Sending response:", response);
    
    res.json(response);
  } catch (error) {
    console.error("❌ [PRODUCT COUNT] Error:", error);
    console.error("❌ [PRODUCT COUNT] Stack trace:", error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get products with profit analysis
router.get("/", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    const products = await productController.getProductsWithProfitAnalysis(shop, req.query);
    res.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single product profit analysis
router.get("/:productId/analysis", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    const { productId } = req.params;
    const analysis = await productController.getProductProfitAnalysis(shop, productId);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error("Error fetching product analysis:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create sample products (for demo purposes)
router.post("/", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    const result = await productController.createSampleProducts(shop);
    res.json({ success: true, result });
  } catch (error) {
    console.error("Error creating sample products:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update product cost data
router.put("/:productId/costs", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    const { productId } = req.params;
    const costData = req.body;
    
    const result = await productController.updateProductCosts(shop, productId, costData);
    res.json({ success: true, result });
  } catch (error) {
    console.error("Error updating product costs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
