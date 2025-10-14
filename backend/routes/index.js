import express from "express";
import productRoutes from "./productRoutes.js";
import billingRoutes from "./billingRoutes.js";
import storeRoutes from "./storeRoutes.js";
import storeDataRoutes from "./storeDataRoutes.js";
import authRoutes from "./authRoutes.js";
import debugRoutes from "./debug.js";

const router = express.Router();

// Mount all route modules
router.use("/products", productRoutes);
router.use("/billing", billingRoutes);
router.use("/stores", storeRoutes);
router.use("/store-data", storeDataRoutes);
router.use("/auth", authRoutes);
router.use("/debug", debugRoutes);

export default router;
