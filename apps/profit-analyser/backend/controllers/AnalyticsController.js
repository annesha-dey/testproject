/**
 * Analytics Controller for Profit Analyser
 * Handles analytics data processing and dashboard metrics
 */

import { APIFactory } from "../../../../core/utils/api.js";

export default class AnalyticsController {
  constructor() {
    this.name = "AnalyticsController";
  }
  /**
   * Get dashboard data with key metrics
   */
  async getDashboardData(shop, options = {}) {
    try {
      console.log(`🔄 [ANALYTICS] Fetching dashboard data for shop: ${shop}`);
      console.log(`🔍 [ANALYTICS] Options:`, options);
      
      console.log(`🔄 [ANALYTICS] Creating API clients...`);
      const { rest } = await APIFactory.createClients(shop);
      console.log(`✅ [ANALYTICS] API clients created successfully`);
      
      // Get basic shop metrics
      console.log(`🔄 [ANALYTICS] Fetching products...`);
      const productsResponse = await rest.getProducts({ limit: 10 });
      const products = productsResponse.body?.products || productsResponse.products || [];
      console.log(`✅ [ANALYTICS] Products fetched: ${products.length}`);
      
      // Try to fetch orders, but handle permission errors gracefully
      let orders = [];
      try {
        console.log(`🔄 [ANALYTICS] Fetching orders...`);
        const ordersResponse = await rest.getOrders({ limit: 50, status: 'any' });
        orders = ordersResponse.body?.orders || ordersResponse.orders || [];
        console.log(`✅ [ANALYTICS] Orders fetched: ${orders.length}`);
      } catch (orderError) {
        console.log(`⚠️ [ANALYTICS] Could not fetch orders (likely missing read_orders scope):`, orderError.message);
        orders = []; // Use empty array if orders can't be fetched
      }
      
      // Calculate basic metrics
      console.log(`🔄 [ANALYTICS] Calculating metrics...`);
      const totalOrders = orders.length;
      const totalProducts = products.length;
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
      
      // Mock profit calculation (30% margin)
      const totalProfit = totalRevenue * 0.3;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      
      console.log(`🔍 [ANALYTICS] Calculated metrics:`, {
        totalOrders,
        totalProducts,
        totalRevenue: totalRevenue.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        profitMargin: profitMargin.toFixed(1)
      });
      
      const dashboardData = {
        summary: {
          totalOrders,
          totalProducts,
          totalRevenue: totalRevenue.toFixed(2),
          totalProfit: totalProfit.toFixed(2),
          profitMargin: profitMargin.toFixed(1)
        },
        recentOrders: orders.slice(0, 5).map(order => ({
          id: order.id,
          name: order.name,
          total: order.total_price,
          date: order.created_at
        })),
        topProducts: products.slice(0, 5).map(product => ({
          id: product.id,
          title: product.title,
          price: product.variants?.[0]?.price || '0'
        }))
      };
      
      console.log(`✅ [ANALYTICS] Dashboard data compiled for ${shop}`);
      console.log(`🔍 [ANALYTICS] Dashboard data:`, dashboardData);
      return dashboardData;
      
    } catch (error) {
      console.error(`❌ [ANALYTICS] Error fetching dashboard data:`, error);
      console.error(`❌ [ANALYTICS] Error stack:`, error.stack);
      console.error(`❌ [ANALYTICS] Error details:`, {
        message: error.message,
        name: error.name,
        shop: shop
      });
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
