/**
 * Profit Analyser App Routes
 * Main routing file for the profit analyser application
 */

import express from "express";
import productRoutes from "./productRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import reportRoutes from "./reportRoutes.js";
import storeRoutes from "./storeRoutes.js";
import syncStatusRoutes from "./syncStatusRoutes.js";
import ordersRoutes from "./ordersRoutes.js";
import productsRoutes from "./productsRoutes.js";
import cleanupRoutes from "./cleanupRoutes.js";
import customersRoutes from "./customersRoutes.js";

const router = express.Router();

// Add logging middleware for all profit-analyser routes
router.use((req, res, next) => {
  console.log(`🔍 [PROFIT-ANALYSER] Route hit: ${req.method} ${req.originalUrl}`);
  console.log(`🔍 [PROFIT-ANALYSER] Path: ${req.path}`);
  console.log(`🔍 [PROFIT-ANALYSER] Query:`, req.query);
  if (req.path.includes('analytics') || req.path.includes('dashboard')) {
    console.log(`🎯 [PROFIT-ANALYSER] ANALYTICS/DASHBOARD REQUEST!`);
  }
  next();
});

// Mount routes
router.use("/products", productRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/reports", reportRoutes);
router.use("/store-data", storeRoutes);
router.use("/sync", syncStatusRoutes);
router.use("/orders", ordersRoutes);
router.use("/products-data", productsRoutes);
router.use("/cleanup", cleanupRoutes);
router.use("/customers", customersRoutes);

// App health check
router.get("/health", (req, res) => {
  res.json({
    app: "profit-analyser",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

export default router;
