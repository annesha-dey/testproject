/**
 * Analytics Controller for Profit Analyser
 * Handles analytics data processing and dashboard metrics
 */

import { APIFactory } from "../../../../core/utils/api.js";
import Order from "../../../../core/db/models/Order.js";
import LineItem from "../../../../core/db/models/LineItem.js";
import Product from "../../../../core/db/models/Product.js";
import Customer from "../../../../core/db/models/Customer.js";

export default class AnalyticsController {
  constructor() {
    this.name = "AnalyticsController";
  }
  /**
   * Get dashboard data with key metrics from Day 1 fetched data
   */
  async getDashboardData(shop, options = {}) {
    try {
      console.log(`🔄 [ANALYTICS] Fetching dashboard data for shop: ${shop}`);
      console.log(`🔍 [ANALYTICS] Options:`, options);
      
      // Get data from Day 1 fetched MongoDB collections
      console.log(`🔄 [ANALYTICS] Fetching data from MongoDB...`);
      
      const [orders, products, customers, lineItems] = await Promise.all([
        Order.find({ shop }).sort({ createdAt: -1 }).limit(100),
        Product.find({ shop }).sort({ createdAt: -1 }).limit(50),
        Customer.find({ shop }).sort({ createdAt: -1 }).limit(50),
        LineItem.find({ shop }).sort({ createdAt: -1 }).limit(100)
      ]);
      
      console.log(`✅ [ANALYTICS] Data fetched from MongoDB:`, {
        orders: orders.length,
        products: products.length,
        customers: customers.length,
        lineItems: lineItems.length
      });
      
      // Calculate real metrics from Day 1 data
      console.log(`🔄 [ANALYTICS] Calculating real metrics...`);
      
      const totalOrders = orders.length;
      const totalProducts = products.length;
      const totalCustomers = customers.length;
      
      // Calculate revenue and profit from orders
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const totalProfit = orders.reduce((sum, order) => sum + (order.grossProfit || 0), 0);
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      
      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Get top performing products by profit
      const topProducts = await this.getTopProductsByProfit(shop, 5);
      
      // Get recent orders with profit data
      const recentOrders = orders.slice(0, 5).map(order => ({
        id: order.shopifyOrderId,
        name: order.orderNumber || `#${order.shopifyOrderId}`,
        total: order.totalPrice || 0,
        profit: order.grossProfit || 0,
        profitMargin: order.profitMargin || 0,
        date: order.createdAt,
        status: order.financialStatus
      }));
      
      // Calculate trends (compare last 30 days vs previous 30 days)
      const trends = await this.calculateTrends(shop);
      
      console.log(`🔍 [ANALYTICS] Calculated real metrics:`, {
        totalOrders,
        totalProducts,
        totalCustomers,
        totalRevenue: totalRevenue.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        profitMargin: profitMargin.toFixed(1),
        averageOrderValue: averageOrderValue.toFixed(2)
      });
      
      const dashboardData = {
        summary: {
          totalOrders,
          totalProducts,
          totalCustomers,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalProfit: parseFloat(totalProfit.toFixed(2)),
          profitMargin: parseFloat(profitMargin.toFixed(1)),
          averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
        },
        trends: {
          revenueGrowth: trends.revenueGrowth,
          profitGrowth: trends.profitGrowth,
          orderGrowth: trends.orderGrowth
        },
        recentOrders,
        topProducts,
        performance: {
          totalLineItems: lineItems.length,
          averageProfitPerOrder: totalOrders > 0 ? parseFloat((totalProfit / totalOrders).toFixed(2)) : 0,
          conversionMetrics: {
            ordersPerCustomer: totalCustomers > 0 ? parseFloat((totalOrders / totalCustomers).toFixed(2)) : 0,
            revenuePerCustomer: totalCustomers > 0 ? parseFloat((totalRevenue / totalCustomers).toFixed(2)) : 0
          }
        }
      };
      
      console.log(`✅ [ANALYTICS] Dashboard data compiled for ${shop}`);
      return dashboardData;
      
    } catch (error) {
      console.error(`❌ [ANALYTICS] Error fetching dashboard data:`, error);
      console.error(`❌ [ANALYTICS] Error stack:`, error.stack);
      throw error;
    }
  }

  /**
   * Get profit trends over time
   */
  async getProfitTrends(shop, options = {}) {
    try {
      console.log(`🔄 Fetching profit trends for shop: ${shop}`);
      
      const { rest } = await APIFactory.createClients(shop);
      const dateRange = this.getDateRange(options.period || '90d');
      
      const ordersResponse = await rest.getOrders({
        limit: 250,
        status: 'any',
        created_at_min: dateRange.start,
        created_at_max: dateRange.end
      });
      
      const orders = ordersResponse.body.orders;
      
      // Group orders by date and calculate daily profits
      const dailyProfits = this.groupOrdersByDate(orders);
      const trends = this.calculateTrendMetrics(dailyProfits);
      
      console.log(`✅ Profit trends calculated for shop: ${shop}`);
      return trends;
      
    } catch (error) {
      console.error(`❌ Error fetching profit trends:`, error);
      throw error;
    }
  }

  /**
   * Get top performing products by profit
   */
  async getTopPerformingProducts(shop, options = {}) {
    try {
      console.log(`🔄 Fetching top performing products for shop: ${shop}`);
      
      const { rest } = await APIFactory.createClients(shop);
      
      // Get recent orders
      const ordersResponse = await rest.getOrders({
        limit: 250,
        status: 'any',
        created_at_min: this.getDateRange(options.period || '30d').start
      });
      
      const orders = ordersResponse.body.orders;
      
      // Analyze product performance
      const productPerformance = this.analyzeProductPerformance(orders);
      const topProducts = productPerformance
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, options.limit || 10);
      
      console.log(`✅ Top performing products calculated for shop: ${shop}`);
      return topProducts;
      
    } catch (error) {
      console.error(`❌ Error fetching top performing products:`, error);
      throw error;
    }
  }

  /**
   * Calculate total revenue from orders
   */
  calculateTotalRevenue(orders) {
    return orders.reduce((total, order) => {
      return total + parseFloat(order.total_price || 0);
    }, 0);
  }

  /**
   * Calculate total profit from orders (mock calculation)
   */
  calculateTotalProfit(orders) {
    const totalRevenue = this.calculateTotalRevenue(orders);
    // Mock: assume 30% profit margin
    return totalRevenue * 0.3;
  }

  /**
   * Calculate average profit margin
   */
  calculateAverageProfitMargin(orders) {
    if (orders.length === 0) return 0;
    
    const totalRevenue = this.calculateTotalRevenue(orders);
    const totalProfit = this.calculateTotalProfit(orders);
    
    return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  }

  /**
   * Calculate average order value
   */
  calculateAverageOrderValue(orders) {
    if (orders.length === 0) return 0;
    
    const totalRevenue = this.calculateTotalRevenue(orders);
    return totalRevenue / orders.length;
  }

  /**
   * Get top products from order data
   */
  async getTopProductsFromOrders(shop, orders) {
    const productSales = {};
    
    orders.forEach(order => {
      order.line_items?.forEach(item => {
        const productId = item.product_id;
        if (!productSales[productId]) {
          productSales[productId] = {
            productId,
            title: item.title,
            quantity: 0,
            revenue: 0,
            profit: 0
          };
        }
        
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += parseFloat(item.price) * item.quantity;
        productSales[productId].profit += parseFloat(item.price) * item.quantity * 0.3; // Mock profit
      });
    });
    
    return Object.values(productSales)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
  }

  /**
   * Calculate profit trend
   */
  calculateProfitTrend(orders) {
    if (orders.length < 2) return 0;
    
    // Sort orders by date
    const sortedOrders = orders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Split into two halves and compare
    const midpoint = Math.floor(sortedOrders.length / 2);
    const firstHalf = sortedOrders.slice(0, midpoint);
    const secondHalf = sortedOrders.slice(midpoint);
    
    const firstHalfProfit = this.calculateTotalProfit(firstHalf);
    const secondHalfProfit = this.calculateTotalProfit(secondHalf);
    
    if (firstHalfProfit === 0) return 0;
    
    return ((secondHalfProfit - firstHalfProfit) / firstHalfProfit) * 100;
  }

  /**
   * Get recent activity
   */
  getRecentActivity(orders) {
    return orders
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        name: order.name,
        total: order.total_price,
        profit: parseFloat(order.total_price) * 0.3, // Mock profit
        createdAt: order.created_at
      }));
  }

  /**
   * Group orders by date
   */
  groupOrdersByDate(orders) {
    const grouped = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(order);
    });
    
    return grouped;
  }

  /**
   * Calculate trend metrics
   */
  calculateTrendMetrics(dailyProfits) {
    const dates = Object.keys(dailyProfits).sort();
    const trends = dates.map(date => {
      const dayOrders = dailyProfits[date];
      const revenue = this.calculateTotalRevenue(dayOrders);
      const profit = this.calculateTotalProfit(dayOrders);
      
      return {
        date,
        revenue,
        profit,
        orderCount: dayOrders.length
      };
    });
    
    return trends;
  }

  /**
   * Analyze product performance from orders
   */
  analyzeProductPerformance(orders) {
    const productStats = {};
    
    orders.forEach(order => {
      order.line_items?.forEach(item => {
        const productId = item.product_id;
        if (!productStats[productId]) {
          productStats[productId] = {
            productId,
            title: item.title,
            totalQuantity: 0,
            totalRevenue: 0,
            totalProfit: 0,
            orderCount: 0
          };
        }
        
        const itemRevenue = parseFloat(item.price) * item.quantity;
        const itemProfit = itemRevenue * 0.3; // Mock profit calculation
        
        productStats[productId].totalQuantity += item.quantity;
        productStats[productId].totalRevenue += itemRevenue;
        productStats[productId].totalProfit += itemProfit;
        productStats[productId].orderCount += 1;
      });
    });
    
    return Object.values(productStats);
  }

  /**
   * Get top products by profit from Day 1 data
   */
  async getTopProductsByProfit(shop, limit = 5) {
    try {
      console.log(`🔍 [ANALYTICS] Getting top ${limit} products by profit for shop: ${shop}`);
      
      // Aggregate line items by product to calculate profit
      const productProfits = await LineItem.aggregate([
        { $match: { shop } },
        {
          $group: {
            _id: "$productId",
            totalQuantity: { $sum: "$quantity" },
            totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
            totalCost: { $sum: { $multiply: ["$cost", "$quantity"] } },
            productTitle: { $first: "$productTitle" }
          }
        },
        {
          $addFields: {
            totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] }
          }
        },
        { $sort: { totalProfit: -1 } },
        { $limit: limit }
      ]);
      
      // Get product titles from Product collection for products without titles
      const productsWithTitles = await Promise.all(productProfits.map(async (product) => {
        let title = product.productTitle;
        
        if (!title || title === 'Unknown Product') {
          // Try to get title from Product collection
          const productDoc = await Product.findOne({ 
            shop, 
            shopifyProductId: product._id 
          }).lean();
          
          title = productDoc?.title || `Product ${product._id}`;
        }
        
        return {
          id: product._id,
          title,
          totalQuantity: product.totalQuantity,
          totalRevenue: parseFloat(product.totalRevenue.toFixed(2)),
          totalProfit: parseFloat(product.totalProfit.toFixed(2)),
          profitMargin: product.totalRevenue > 0 ? 
            parseFloat(((product.totalProfit / product.totalRevenue) * 100).toFixed(1)) : 0
        };
      }));
      
      return productsWithTitles;
    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting top products by profit:', error);
      return [];
    }
  }

  /**
   */
  async calculateTrends(shop) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
      
      // Get current period (last 30 days)
      const currentPeriodOrders = await Order.find({
        shop,
        createdAt: { $gte: thirtyDaysAgo, $lte: now }
      });
      
      // Get previous period (30-60 days ago)
      const previousPeriodOrders = await Order.find({
        shop,
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      });
      
      // Calculate metrics for both periods
      const currentRevenue = currentPeriodOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const currentProfit = currentPeriodOrders.reduce((sum, order) => sum + (order.grossProfit || 0), 0);
      const currentOrderCount = currentPeriodOrders.length;
      
      const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const previousProfit = previousPeriodOrders.reduce((sum, order) => sum + (order.grossProfit || 0), 0);
      const previousOrderCount = previousPeriodOrders.length;
      
      // Calculate growth percentages
      const revenueGrowth = previousRevenue > 0 ? 
        parseFloat((((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)) : 0;
      
      const profitGrowth = previousProfit > 0 ? 
        parseFloat((((currentProfit - previousProfit) / previousProfit) * 100).toFixed(1)) : 0;
      
      const orderGrowth = previousOrderCount > 0 ? 
        parseFloat((((currentOrderCount - previousOrderCount) / previousOrderCount) * 100).toFixed(1)) : 0;
      
      return {
        revenueGrowth,
        profitGrowth,
        orderGrowth
      };
      
    } catch (error) {
      console.error(`❌ [ANALYTICS] Error calculating trends:`, error);
      return {
        revenueGrowth: 0,
        profitGrowth: 0,
        orderGrowth: 0
      };
    }
  }

  /**
   * Get date range based on period
   */
  getDateRange(period) {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }
}
