import express from 'express';
import { validateSession } from '../../../../core/auth/index.js';
import { executeDataCleanup } from '../../../../core/jobs/dataCleanupJob.js';

const router = express.Router();

// Manual cleanup endpoint for testing/emergency cleanup
router.post("/manual-cleanup", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({
        success: false,
        error: 'Shop parameter is required'
      });
    }

    console.log(`🗑️ [MANUAL-CLEANUP] Manual cleanup requested for shop: ${shop}`);

    // Execute cleanup
    const result = await executeDataCleanup(shop, {
      trigger: 'manual_cleanup',
      requestedBy: 'admin',
      timestamp: new Date()
    });

    if (result.success) {
      console.log(`✅ [MANUAL-CLEANUP] Cleanup completed for ${shop}`);
      res.json({
        success: true,
        message: 'Data cleanup completed successfully',
        stats: result.stats,
        duration: result.duration
      });
    } else {
      console.error(`❌ [MANUAL-CLEANUP] Cleanup failed for ${shop}:`, result.error);
      res.status(500).json({
        success: false,
        error: result.error,
        stats: result.stats
      });
    }

  } catch (error) {
    console.error('❌ [MANUAL-CLEANUP] Error during manual cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check cleanup status
router.get("/cleanup-status", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({
        success: false,
        error: 'Shop parameter is required'
      });
    }

    // Import models to check data counts
    const Order = (await import('../../../../core/db/models/Order.js')).default;
    const LineItem = (await import('../../../../core/db/models/LineItem.js')).default;
    const Product = (await import('../../../../core/db/models/Product.js')).default;
    const Customer = (await import('../../../../core/db/models/Customer.js')).default;
    const Store = (await import('../../../../core/db/models/Store.js')).default;

    const counts = {
      orders: await Order.countDocuments({ shop }),
      lineItems: await LineItem.countDocuments({ shop }),
      products: await Product.countDocuments({ shop }),
      customers: await Customer.countDocuments({ shop }),
      stores: await Store.countDocuments({ shop })
    };

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);

    res.json({
      success: true,
      shop,
      counts,
      totalRecords,
      isClean: totalRecords === 0
    });

  } catch (error) {
    console.error('❌ [CLEANUP-STATUS] Error checking cleanup status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
