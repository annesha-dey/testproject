import express from "express";
import productRoutes from "./productRoutes.js";
import debugRoutes from "./debug.js";
import storeRoutes from "./storeRoutes.js";
import billingRoutes from "./billingRoutes.js";

const router = express.Router();

router.use("/products", productRoutes);
router.use("/debug", debugRoutes);
router.use("/stores", storeRoutes);
router.use("/billing", billingRoutes);

export default router;
