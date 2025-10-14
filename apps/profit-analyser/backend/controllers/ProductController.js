/**
 * Product Controller for Profit Analyser
 * Handles product-related operations and profit calculations
 */

import { APIFactory } from "../../../../core/utils/api.js";

export default class ProductController {
  constructor() {
    this.name = "ProductController";
  }

  /**
   * Get product count
   */
  async getProductCount(shop) {
    try {
      console.log(`🔄 Getting product count for shop: ${shop}`);
      
      const { rest } = await APIFactory.createClients(shop);
      
      // Get all products to count them properly
      console.log(`🔄 Fetching all products to count...`);
      const response = await rest.getProducts({ limit: 250 }); // Shopify max limit
      
      console.log(`🔍 Products response:`, response);
      
      // Extract products from response
      const products = response.body?.products || response.products || [];
      const count = products.length;
      
      console.log(`✅ Product count retrieved: ${count} products found`);
      console.log(`🔍 First few products:`, products.slice(0, 3).map(p => ({ id: p.id, title: p.title })));
      
      return count;
      
    } catch (error) {
      console.error(`❌ Error getting product count:`, error);
      throw error;
    }
  }

  /**
   * Create sample products for demo purposes
   */
  async createSampleProducts(shop) {
    try {
      console.log(`🔄 Creating sample products for shop: ${shop}`);
      
      const { rest } = await APIFactory.createClients(shop);
      
      const sampleProducts = [
        {
          title: "Sample Product 1",
          body_html: "<p>A great sample product for testing</p>",
          vendor: "Sample Vendor",
          product_type: "Sample Type",
          variants: [{
            price: "29.99",
            inventory_quantity: 100
          }]
        },
        {
          title: "Sample Product 2", 
          body_html: "<p>Another sample product</p>",
          vendor: "Sample Vendor",
          product_type: "Sample Type",
          variants: [{
            price: "49.99",
            inventory_quantity: 50
          }]
        }
      ];
      
      const createdProducts = [];
      for (const productData of sampleProducts) {
        const response = await rest.post('products', { product: productData });
        createdProducts.push(response.body.product);
      }
      
      console.log(`✅ Created ${createdProducts.length} sample products`);
      return { 
        count: createdProducts.length, 
        products: createdProducts 
      };
      
    } catch (error) {
      console.error(`❌ Error creating sample products:`, error);
      throw error;
    }
  }

  /**
   * Get products with profit analysis
   */
  async getProductsWithProfitAnalysis(shop, options = {}) {
    try {
      console.log(`🔄 Fetching products with profit analysis for shop: ${shop}`);
      
      const { rest } = await APIFactory.createClients(shop);
      
      // Fetch products from Shopify
      const response = await rest.getProducts({
        limit: options.limit || 50,
        page_info: options.page_info
      });
      
      const products = response.body.products;
      
      // Add profit analysis to each product
      const productsWithAnalysis = await Promise.all(
        products.map(async (product) => {
          const analysis = await this.calculateProductProfit(shop, product);
          return {
            ...product,
            profitAnalysis: analysis
          };
        })
      );
      
      console.log(`✅ Retrieved ${productsWithAnalysis.length} products with profit analysis`);
      return productsWithAnalysis;
      
    } catch (error) {
      console.error(`❌ Error fetching products with profit analysis:`, error);
      throw error;
    }
  }

  /**
   * Get detailed profit analysis for a single product
   */
  async getProductProfitAnalysis(shop, productId) {
    try {
      console.log(`🔄 Fetching profit analysis for product: ${productId}`);
      
      const { rest } = await APIFactory.createClients(shop);
      
      // Get product details
      const productResponse = await rest.getProduct(productId);
      const product = productResponse.body.product;
      
      // Get detailed profit analysis
      const analysis = await this.calculateDetailedProductProfit(shop, product);
      
      console.log(`✅ Profit analysis calculated for product: ${productId}`);
      return analysis;
      
    } catch (error) {
      console.error(`❌ Error fetching product profit analysis:`, error);
      throw error;
    }
  }

  /**
   * Update product cost data
   */
  async updateProductCosts(shop, productId, costData) {
    try {
      console.log(`🔄 Updating costs for product: ${productId}`);
      
      // Here you would typically store cost data in your database
      // For now, we'll return a mock response
      
      const updatedCosts = {
        productId,
        shop,
        costs: costData,
        updatedAt: new Date()
      };
      
      console.log(`✅ Costs updated for product: ${productId}`);
      return updatedCosts;
      
    } catch (error) {
      console.error(`❌ Error updating product costs:`, error);
      throw error;
    }
  }

  /**
   * Calculate basic profit metrics for a product
   */
  async calculateProductProfit(shop, product) {
    try {
      // Mock calculation - in real implementation, you'd:
      // 1. Get cost data from your database
      // 2. Calculate COGS (Cost of Goods Sold)
      // 3. Factor in shipping, taxes, fees
      // 4. Calculate profit margins
      
      const variant = product.variants[0];
      const price = parseFloat(variant?.price || 0);
      const cost = price * 0.6; // Mock 60% cost ratio
      const profit = price - cost;
      const margin = price > 0 ? (profit / price) * 100 : 0;
      
      return {
        revenue: price,
        cost: cost,
        profit: profit,
        margin: margin,
        status: margin > 20 ? 'profitable' : margin > 0 ? 'break-even' : 'loss'
      };
      
    } catch (error) {
      console.error(`❌ Error calculating product profit:`, error);
      return {
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        status: 'unknown'
      };
    }
  }

  /**
   * Calculate detailed profit analysis for a product
   */
  async calculateDetailedProductProfit(shop, product) {
    try {
      const basicAnalysis = await this.calculateProductProfit(shop, product);
      
      // Add more detailed metrics
      const detailedAnalysis = {
        ...basicAnalysis,
        breakdown: {
          productCost: basicAnalysis.cost * 0.7,
          shippingCost: basicAnalysis.cost * 0.15,
          transactionFees: basicAnalysis.cost * 0.1,
          otherFees: basicAnalysis.cost * 0.05
        },
        recommendations: this.generateRecommendations(basicAnalysis),
        trends: {
          last30Days: Math.random() * 20 - 10, // Mock trend
          last90Days: Math.random() * 30 - 15
        }
      };
      
      return detailedAnalysis;
      
    } catch (error) {
      console.error(`❌ Error calculating detailed product profit:`, error);
      throw error;
    }
  }

  /**
   * Generate recommendations based on profit analysis
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.margin < 10) {
      recommendations.push({
        type: 'warning',
        message: 'Low profit margin detected. Consider reviewing costs or pricing.',
        action: 'review_pricing'
      });
    }
    
    if (analysis.margin > 50) {
      recommendations.push({
        type: 'success',
        message: 'Excellent profit margin! Consider promoting this product.',
        action: 'promote_product'
      });
    }
    
    if (analysis.profit < 0) {
      recommendations.push({
        type: 'error',
        message: 'Product is operating at a loss. Immediate action required.',
        action: 'urgent_review'
      });
    }
    
    return recommendations;
  }
}
