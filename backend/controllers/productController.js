import Product from "../models/Product.js";

/**
 * Get the count of products in the store
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getProductCount = async (req, res) => {
  try {
    const count = await Product.getCount(res.locals.shopify.session);
    res.status(200).json({ count });
  } catch (error) {
    console.error(`Failed to get product count: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Create multiple products
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const createProducts = async (req, res) => {
  try {
    await Product.createBulk(res.locals.shopify.session);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Failed to create products: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
