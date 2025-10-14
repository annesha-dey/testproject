/**
 * Sync Status Routes - API endpoints for Day 1 data sync status
 */

import express from "express";
import { validateSession } from "../../../../core/auth/index.js";
import StoreManager from "../../../../core/utils/storeManager.js";
import Order from "../../../../core/db/models/Order.js";
import Product from "../../../../core/db/models/Product.js";
import Customer from "../../../../core/db/models/Customer.js";

const storeManager = new StoreManager();

const router = express.Router();

// Get Day 1 data sync status
router.get("/day1-status", validateSession, async (req, res) => {
  try {
    console.log("🔍 [SYNC-STATUS] Day 1 sync status request:", req.query);
    
    const { shop } = req.query;
    
    if (!shop) {
      console.error("❌ [SYNC-STATUS] No shop parameter provided");
      return res.status(400).json({ success: false, error: "Shop parameter is required" });
    }
    
    // Get store data with sync status
    const store = await storeManager.getStore(shop);
    
    if (!store) {
      console.error("❌ [SYNC-STATUS] Store not found:", shop);
      return res.status(404).json({ success: false, error: "Store not found" });
    }
    
    // Get current data counts from database
    const [orderCount, productCount, customerCount] = await Promise.all([
      Order.countDocuments({ shop }),
      Product.countDocuments({ shop }),
      Customer.countDocuments({ shop })
    ]);
    
    const syncStatus = {
      day1DataSynced: store.day1DataSynced || false,
      day1DataSyncedAt: store.day1DataSyncedAt,
      day1DataSyncError: store.day1DataSyncError,
      day1DataStats: store.day1DataStats || {
        orders: 0,
        lineItems: 0,
        products: 0,
        customers: 0,
        refunds: 0,
        errors: 0
      },
      currentDataCounts: {
        orders: orderCount,
        products: productCount,
        customers: customerCount
      },
      syncProgress: {
        isInProgress: !store.day1DataSynced && !store.day1DataSyncError,
        hasError: !!store.day1DataSyncError,
        isComplete: store.day1DataSynced
      }
    };
    
    console.log("✅ [SYNC-STATUS] Day 1 sync status retrieved:", syncStatus);
    
    res.json({
      success: true,
      data: syncStatus
    });
    
  } catch (error) {
    console.error("❌ [SYNC-STATUS] Error fetching Day 1 sync status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger Day 1 data sync manually (for testing/retry)
router.post("/trigger-day1-sync", validateSession, async (req, res) => {
  try {
    console.log("🚀 [SYNC-STATUS] Manual Day 1 sync trigger request:", req.query);
    
    const { shop } = req.query;
    
    if (!shop) {
      console.error("❌ [SYNC-STATUS] No shop parameter provided");
      return res.status(400).json({ success: false, error: "Shop parameter is required" });
    }
    
    // Check if sync is already in progress or completed
    const store = await storeManager.getStore(shop);
    
    if (store?.day1DataSynced) {
      return res.json({
        success: false,
        error: "Day 1 data sync already completed",
        data: { alreadySynced: true }
      });
    }
    
    // Import and trigger Day 1 data fetch
    const { executeDay1DataFetch } = await import("../../../../core/jobs/day1DataFetchJob.js");
    
    // Reset sync error status
    await storeManager.updateStore(shop, {
      day1DataSyncError: null
    });
    
    // Execute in background
    setTimeout(async () => {
      try {
        await executeDay1DataFetch(shop, {
          trigger: 'manual_api',
          triggeredAt: new Date()
        });
      } catch (error) {
        console.error(`❌ [SYNC-STATUS] Manual Day 1 sync failed for ${shop}:`, error);
      }
    }, 1000);
    
    console.log("✅ [SYNC-STATUS] Day 1 sync triggered manually for:", shop);
    
    res.json({
      success: true,
      message: "Day 1 data sync triggered successfully",
      data: { triggered: true }
    });
    
  } catch (error) {
    console.error("❌ [SYNC-STATUS] Error triggering Day 1 sync:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get detailed sync progress (for real-time updates)
router.get("/sync-progress", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ success: false, error: "Shop parameter is required" });
    }
    
    // Get real-time counts
    const [orderCount, productCount, customerCount, lineItemCount, refundCount] = await Promise.all([
      Order.countDocuments({ shop }),
      Product.countDocuments({ shop }),
      Customer.countDocuments({ shop }),
      // Import LineItem and Refund models
      (async () => {
        try {
          const { default: LineItem } = await import("../../../../core/db/models/LineItem.js");
          return await LineItem.countDocuments({ shop });
        } catch {
          return 0;
        }
      })(),
      (async () => {
        try {
          const { default: Refund } = await import("../../../../core/db/models/Refund.js");
          return await Refund.countDocuments({ shop });
        } catch {
          return 0;
        }
      })()
    ]);
    
    const progress = {
      currentCounts: {
        orders: orderCount,
        products: productCount,
        customers: customerCount,
        lineItems: lineItemCount,
        refunds: refundCount
      },
      lastUpdated: new Date()
    };
    
    res.json({
      success: true,
      data: progress
    });
    
  } catch (error) {
    console.error("❌ [SYNC-STATUS] Error fetching sync progress:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
