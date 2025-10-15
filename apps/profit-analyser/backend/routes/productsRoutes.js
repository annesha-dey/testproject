import express from 'express';
import Product from '../../../../core/db/models/Product.js';
import LineItem from '../../../../core/db/models/LineItem.js';
import { validateSession } from '../../../../core/auth/index.js';

const router = express.Router();

// Get all products for a shop
router.get("/list", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({
        success: false,
        error: 'Shop parameter is required'
      });
    }

    console.log(`🔍 [PRODUCTS] Fetching products for shop: ${shop}`);

    // Fetch products from database
    const products = await Product.find({ shop })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    console.log(`✅ [PRODUCTS] Found ${products.length} products`);

    // Calculate profit metrics for each product
    const productsWithMetrics = await Promise.all(products.map(async (product) => {
      // Get line items for this product
      const lineItems = await LineItem.find({ 
        shop, 
        productId: product.shopifyProductId 
      }).lean();

      let totalQuantitySold = 0;
      let totalRevenue = 0;
      let totalProfit = 0;

      // Calculate metrics from line items
      lineItems.forEach(item => {
        const quantity = parseInt(item.quantity) || 0;
        const revenue = parseFloat(item.price) * quantity;
        const cost = parseFloat(item.cost || 0) * quantity;
        
        totalQuantitySold += quantity;
        totalRevenue += revenue;
        totalProfit += (revenue - cost);
      });

      const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

      return {
        id: product.shopifyProductId,
        title: product.title || 'Untitled Product',
        handle: product.handle,
        vendor: product.vendor,
        productType: product.productType,
        status: product.status,
        totalInventory: product.totalInventory || 0,
        variants: product.variants?.length || 0,
        images: product.images || [],
        totalQuantitySold,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    }));

    // Sort by total revenue (best performing first)
    productsWithMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      success: true,
      data: {
        products: productsWithMetrics,
        total: productsWithMetrics.length,
        summary: {
          totalProducts: productsWithMetrics.length,
          totalRevenue: productsWithMetrics.reduce((sum, product) => sum + product.totalRevenue, 0),
          totalProfit: productsWithMetrics.reduce((sum, product) => sum + product.totalProfit, 0),
          totalQuantitySold: productsWithMetrics.reduce((sum, product) => sum + product.totalQuantitySold, 0)
        }
      }
    });

  } catch (error) {
    console.error('❌ [PRODUCTS] Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get product count (for dashboard)
router.get("/count", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({
        success: false,
        error: 'Shop parameter is required'
      });
    }

    const count = await Product.countDocuments({ shop });
    
    res.json({
      success: true,
      data: {
        count
      }
    });

  } catch (error) {
    console.error('❌ [PRODUCTS] Error getting product count:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
