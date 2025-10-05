import express from "express";
import { getProductCount, createProducts } from "../controllers/productController.js";

const router = express.Router();

// GET /api/products/count - Get product count
router.get("/count", getProductCount);

// POST /api/products - Create products
router.post("/", createProducts);

export default router;
