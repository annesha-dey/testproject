import express from "express";
import { getProductCount, createProducts } from "../controllers/productController.js";
import { validateSession } from "../middleware/auth.js";

const router = express.Router();

// GET /api/products/count - Get product count
router.get("/count", validateSession, getProductCount);

// POST /api/products - Create products
router.post("/", validateSession, createProducts);

export default router;
