/**
 * Metrics Computation Jobs
 * 
 * Background jobs to compute profit metrics, customer LTV, and product performance
 * after Day 1 data fetch is completed.
 */

import Order from '../db/models/Order.js';
import LineItem from '../db/models/LineItem.js';
import Product from '../db/models/Product.js';
import Customer from '../db/models/Customer.js';
import Refund from '../db/models/Refund.js';

/**
 * Compute profit metrics for all orders
 */
export async function executeProfitMetricsComputation(shop, options = {}) {
  console.log(`🔄 [PROFIT-METRICS] Starting profit metrics computation for shop: ${shop}`);
  
  const startTime = Date.now();
  let processedOrders = 0;
  let processedLineItems = 0;
  
  try {
    // Get all orders for the shop
    const orders = await Order.find({ shop }).sort({ createdAt: -1 });
    console.log(`📊 [PROFIT-METRICS] Found ${orders.length} orders to process`);
    
    for (const order of orders) {
      try {
        // Get line items for this order
        const lineItems = await LineItem.find({ 
          shop, 
          shopifyOrderId: order.shopifyOrderId 
        });
        
        let totalOrderCost = 0;
        
        // Calculate profit for each line item
        for (const lineItem of lineItems) {
          // Try to get unit cost from product variant
          const product = await Product.findOne({
            shop,
            shopifyProductId: lineItem.shopifyProductId
          });
          
          if (product) {
            const variant = product.variants.find(v => 
              v.shopifyVariantId === lineItem.shopifyVariantId
            );
            
            if (variant && variant.unitCost > 0) {
              lineItem.unitCost = variant.unitCost;
            }
          }
          
          // Calculate line item profit
          lineItem.calculateProfit();
          await lineItem.save();
          
          totalOrderCost += lineItem.totalCost;
          processedLineItems++;
        }
        
        // Calculate order-level profit
        order.totalCost = totalOrderCost;
        order.calculateProfit();
        
        // Adjust for refunds
        const refunds = await Refund.find({ 
          shop, 
          shopifyOrderId: order.shopifyOrderId 
        });
        
        let totalRefundImpact = 0;
        for (const refund of refunds) {
          refund.calculateProfitImpact(order.totalCost);
          await refund.save();
          totalRefundImpact += refund.profitImpact;
        }
        
        // Adjust gross profit for refunds
        order.grossProfit -= totalRefundImpact;
        order.profitMargin = order.totalPrice > 0 ? 
          (order.grossProfit / order.totalPrice) * 100 : 0;
        
        await order.save();
        processedOrders++;
        
        if (processedOrders % 100 === 0) {
          console.log(`📈 [PROFIT-METRICS] Processed ${processedOrders}/${orders.length} orders`);
        }
        
      } catch (orderError) {
        console.error(`❌ [PROFIT-METRICS] Error processing order ${order.shopifyOrderId}:`, orderError);
      }
    }
    
    const duration = Date.now() - startTime;
    const durationMinutes = Math.round(duration / 1000 / 60);
    
    console.log(`✅ [PROFIT-METRICS] Completed profit metrics computation for ${shop}`);
    console.log(`📊 [PROFIT-METRICS] Stats: ${processedOrders} orders, ${processedLineItems} line items in ${durationMinutes} minutes`);
    
    return {
      success: true,
      processedOrders,
      processedLineItems,
      duration: durationMinutes
    };
    
  } catch (error) {
    console.error(`❌ [PROFIT-METRICS] Failed profit metrics computation for ${shop}:`, error);
    throw error;
  }
}

/**
 * Compute customer LTV and segments
 */
export async function executeCustomerLTVComputation(shop, options = {}) {
  console.log(`🔄 [CUSTOMER-LTV] Starting customer LTV computation for shop: ${shop}`);
  
  const startTime = Date.now();
  let processedCustomers = 0;
  
  try {
    // Get all customers for the shop
    const customers = await Customer.find({ shop });
    console.log(`👥 [CUSTOMER-LTV] Found ${customers.length} customers to process`);
    
    for (const customer of customers) {
      try {
        // Get customer's orders
        const customerOrders = await Order.find({
          shop,
          customerId: customer.shopifyCustomerId
        }).sort({ createdAt: 1 });
        
        if (customerOrders.length > 0) {
          // Update customer metrics
          customer.ordersCount = customerOrders.length;
          customer.totalSpent = customerOrders.reduce((sum, order) => sum + order.totalPrice, 0);
          customer.firstOrderDate = customerOrders[0].createdAt;
          customer.lastOrderDate = customerOrders[customerOrders.length - 1].createdAt;
          
          // Calculate days since first/last order
          const now = new Date();
          customer.daysSinceFirstOrder = Math.floor((now - customer.firstOrderDate) / (1000 * 60 * 60 * 24));
          customer.daysSinceLastOrder = Math.floor((now - customer.lastOrderDate) / (1000 * 60 * 60 * 24));
          
          // Calculate LTV and update segment
          customer.calculateLTV();
          customer.updateSegment();
        }
        
        await customer.save();
        processedCustomers++;
        
        if (processedCustomers % 100 === 0) {
          console.log(`👤 [CUSTOMER-LTV] Processed ${processedCustomers}/${customers.length} customers`);
        }
        
      } catch (customerError) {
        console.error(`❌ [CUSTOMER-LTV] Error processing customer ${customer.shopifyCustomerId}:`, customerError);
      }
    }
    
    const duration = Date.now() - startTime;
    const durationMinutes = Math.round(duration / 1000 / 60);
    
    console.log(`✅ [CUSTOMER-LTV] Completed customer LTV computation for ${shop}`);
    console.log(`📊 [CUSTOMER-LTV] Stats: ${processedCustomers} customers in ${durationMinutes} minutes`);
    
    return {
      success: true,
      processedCustomers,
      duration: durationMinutes
    };
    
  } catch (error) {
    console.error(`❌ [CUSTOMER-LTV] Failed customer LTV computation for ${shop}:`, error);
    throw error;
  }
}

/**
 * Analyze product performance
 */
export async function executeProductPerformanceAnalysis(shop, options = {}) {
  console.log(`🔄 [PRODUCT-PERFORMANCE] Starting product performance analysis for shop: ${shop}`);
  
  const startTime = Date.now();
  let processedProducts = 0;
  
  try {
    // Get all products for the shop
    const products = await Product.find({ shop });
    console.log(`📦 [PRODUCT-PERFORMANCE] Found ${products.length} products to analyze`);
    
    for (const product of products) {
      try {
        // Get line items for this product
        const lineItems = await LineItem.find({
          shop,
          shopifyProductId: product.shopifyProductId
        });
        
        // Calculate product performance metrics
        const totalQuantitySold = lineItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalProfit = lineItems.reduce((sum, item) => sum + (item.grossProfit || 0), 0);
        
        // Update product with performance data
        product.performanceMetrics = {
          totalQuantitySold,
          totalRevenue,
          totalProfit,
          profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
          averageOrderValue: lineItems.length > 0 ? totalRevenue / lineItems.length : 0,
          lastSoldAt: lineItems.length > 0 ? 
            Math.max(...lineItems.map(item => new Date(item.createdAt))) : null
        };
        
        // Calculate variant profits
        product.calculateVariantProfits();
        
        await product.save();
        processedProducts++;
        
        if (processedProducts % 50 === 0) {
          console.log(`📈 [PRODUCT-PERFORMANCE] Processed ${processedProducts}/${products.length} products`);
        }
        
      } catch (productError) {
        console.error(`❌ [PRODUCT-PERFORMANCE] Error processing product ${product.shopifyProductId}:`, productError);
      }
    }
    
    const duration = Date.now() - startTime;
    const durationMinutes = Math.round(duration / 1000 / 60);
    
    console.log(`✅ [PRODUCT-PERFORMANCE] Completed product performance analysis for ${shop}`);
    console.log(`📊 [PRODUCT-PERFORMANCE] Stats: ${processedProducts} products in ${durationMinutes} minutes`);
    
    return {
      success: true,
      processedProducts,
      duration: durationMinutes
    };
    
  } catch (error) {
    console.error(`❌ [PRODUCT-PERFORMANCE] Failed product performance analysis for ${shop}:`, error);
    throw error;
  }
}

/**
 * Job definitions for the job scheduler
 */
export const metricsJobDefinitions = {
  'profit-metrics-computation': {
    name: 'profit-metrics-computation',
    description: 'Compute profit metrics for orders and line items',
    handler: executeProfitMetricsComputation,
    options: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 30000
      },
      removeOnComplete: 5,
      removeOnFail: 3
    }
  },
  
  'customer-ltv-computation': {
    name: 'customer-ltv-computation',
    description: 'Compute customer LTV and segments',
    handler: executeCustomerLTVComputation,
    options: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 30000
      },
      removeOnComplete: 5,
      removeOnFail: 3
    }
  },
  
  'product-performance-analysis': {
    name: 'product-performance-analysis',
    description: 'Analyze product performance metrics',
    handler: executeProductPerformanceAnalysis,
    options: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 30000
      },
      removeOnComplete: 5,
      removeOnFail: 3
    }
  }
};

export default metricsJobDefinitions;
