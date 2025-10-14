/**
 * Report Controller for Profit Analyser
 * Handles report generation and management
 */

import { APIFactory } from "../../../../core/utils/api.js";

export default class ReportController {
  constructor() {
    this.name = "ReportController";
  }

  /**
   * Generate profit report
   */
  async generateProfitReport(shop, reportConfig) {
    try {
      console.log(`🔄 Generating profit report for shop: ${shop}`);
      
      const { rest } = await APIFactory.createClients(shop);
      
      // Get data based on report configuration
      const dateRange = this.getDateRange(reportConfig.period || '30d');
      const ordersResponse = await rest.getOrders({
        limit: 250,
        status: 'any',
        created_at_min: dateRange.start,
        created_at_max: dateRange.end
      });
      
      const orders = ordersResponse.body.orders;
      
      // Generate report based on type
      let reportData;
      switch (reportConfig.type) {
        case 'summary':
          reportData = await this.generateSummaryReport(shop, orders, reportConfig);
          break;
        case 'detailed':
          reportData = await this.generateDetailedReport(shop, orders, reportConfig);
          break;
        case 'product':
          reportData = await this.generateProductReport(shop, orders, reportConfig);
          break;
        default:
          reportData = await this.generateSummaryReport(shop, orders, reportConfig);
      }
      
      // Save report metadata
      const report = {
        id: `report_${Date.now()}`,
        shop,
        type: reportConfig.type || 'summary',
        period: reportConfig.period || '30d',
        generatedAt: new Date(),
        data: reportData
      };
      
      console.log(`✅ Profit report generated for shop: ${shop}`);
      return report;
      
    } catch (error) {
      console.error(`❌ Error generating profit report:`, error);
      throw error;
    }
  }

  /**
   * Get available reports for a shop
   */
  async getAvailableReports(shop) {
    try {
      console.log(`🔄 Fetching available reports for shop: ${shop}`);
      
      // In a real implementation, you'd fetch from database
      // For now, return mock data
      const reports = [
        {
          id: 'report_1',
          type: 'summary',
          period: '30d',
          generatedAt: new Date(Date.now() - 86400000), // 1 day ago
          status: 'completed'
        },
        {
          id: 'report_2',
          type: 'detailed',
          period: '7d',
          generatedAt: new Date(Date.now() - 3600000), // 1 hour ago
          status: 'completed'
        }
      ];
      
      console.log(`✅ Retrieved ${reports.length} reports for shop: ${shop}`);
      return reports;
      
    } catch (error) {
      console.error(`❌ Error fetching available reports:`, error);
      throw error;
    }
  }

  /**
   * Download report data
   */
  async downloadReport(shop, reportId) {
    try {
      console.log(`🔄 Downloading report: ${reportId} for shop: ${shop}`);
      
      // In a real implementation, you'd fetch from database
      // For now, generate a mock report
      const reportData = {
        reportId,
        shop,
        generatedAt: new Date(),
        summary: {
          totalRevenue: 15000,
          totalProfit: 4500,
          profitMargin: 30,
          orderCount: 150
        },
        details: {
          topProducts: [
            { name: 'Product A', profit: 1200, margin: 35 },
            { name: 'Product B', profit: 800, margin: 25 }
          ],
          trends: [
            { date: '2024-01-01', profit: 150 },
            { date: '2024-01-02', profit: 200 }
          ]
        }
      };
      
      console.log(`✅ Report downloaded: ${reportId}`);
      return reportData;
      
    } catch (error) {
      console.error(`❌ Error downloading report:`, error);
      throw error;
    }
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport(shop, orders, config) {
    const totalRevenue = this.calculateTotalRevenue(orders);
    const totalProfit = this.calculateTotalProfit(orders);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    return {
      summary: {
        period: config.period,
        totalOrders: orders.length,
        totalRevenue,
        totalProfit,
        profitMargin,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
      },
      topMetrics: {
        bestDay: this.getBestPerformingDay(orders),
        topProduct: this.getTopProduct(orders),
        profitTrend: this.calculateProfitTrend(orders)
      }
    };
  }

  /**
   * Generate detailed report
   */
  async generateDetailedReport(shop, orders, config) {
    const summaryData = await this.generateSummaryReport(shop, orders, config);
    
    return {
      ...summaryData,
      detailed: {
        dailyBreakdown: this.getDailyBreakdown(orders),
        productAnalysis: this.getProductAnalysis(orders),
        customerAnalysis: this.getCustomerAnalysis(orders),
        profitDistribution: this.getProfitDistribution(orders)
      }
    };
  }

  /**
   * Generate product-focused report
   */
  async generateProductReport(shop, orders, config) {
    return {
      products: this.getProductAnalysis(orders),
      insights: {
        mostProfitable: this.getMostProfitableProducts(orders, 5),
        leastProfitable: this.getLeastProfitableProducts(orders, 5),
        recommendations: this.generateProductRecommendations(orders)
      }
    };
  }

  /**
   * Helper methods for calculations
   */
  calculateTotalRevenue(orders) {
    return orders.reduce((total, order) => total + parseFloat(order.total_price || 0), 0);
  }

  calculateTotalProfit(orders) {
    return this.calculateTotalRevenue(orders) * 0.3; // Mock 30% profit margin
  }

  calculateProfitTrend(orders) {
    if (orders.length < 2) return 0;
    
    const sortedOrders = orders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const midpoint = Math.floor(sortedOrders.length / 2);
    const firstHalf = sortedOrders.slice(0, midpoint);
    const secondHalf = sortedOrders.slice(midpoint);
    
    const firstProfit = this.calculateTotalProfit(firstHalf);
    const secondProfit = this.calculateTotalProfit(secondHalf);
    
    return firstProfit > 0 ? ((secondProfit - firstProfit) / firstProfit) * 100 : 0;
  }

  getBestPerformingDay(orders) {
    const dailyProfits = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!dailyProfits[date]) dailyProfits[date] = 0;
      dailyProfits[date] += parseFloat(order.total_price || 0) * 0.3;
    });
    
    const bestDay = Object.entries(dailyProfits)
      .sort(([,a], [,b]) => b - a)[0];
    
    return bestDay ? { date: bestDay[0], profit: bestDay[1] } : null;
  }

  getTopProduct(orders) {
    const productProfits = {};
    
    orders.forEach(order => {
      order.line_items?.forEach(item => {
        const key = item.product_id;
        if (!productProfits[key]) {
          productProfits[key] = { name: item.title, profit: 0 };
        }
        productProfits[key].profit += parseFloat(item.price) * item.quantity * 0.3;
      });
    });
    
    const topProduct = Object.values(productProfits)
      .sort((a, b) => b.profit - a.profit)[0];
    
    return topProduct || null;
  }

  getDailyBreakdown(orders) {
    const dailyData = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, profit: 0, orders: 0 };
      }
      
      const revenue = parseFloat(order.total_price || 0);
      dailyData[date].revenue += revenue;
      dailyData[date].profit += revenue * 0.3;
      dailyData[date].orders += 1;
    });
    
    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getProductAnalysis(orders) {
    const products = {};
    
    orders.forEach(order => {
      order.line_items?.forEach(item => {
        const key = item.product_id;
        if (!products[key]) {
          products[key] = {
            id: key,
            name: item.title,
            quantity: 0,
            revenue: 0,
            profit: 0
          };
        }
        
        const itemRevenue = parseFloat(item.price) * item.quantity;
        products[key].quantity += item.quantity;
        products[key].revenue += itemRevenue;
        products[key].profit += itemRevenue * 0.3;
      });
    });
    
    return Object.values(products);
  }

  getCustomerAnalysis(orders) {
    const customers = {};
    
    orders.forEach(order => {
      const email = order.email || 'anonymous';
      if (!customers[email]) {
        customers[email] = { email, orders: 0, revenue: 0, profit: 0 };
      }
      
      const revenue = parseFloat(order.total_price || 0);
      customers[email].orders += 1;
      customers[email].revenue += revenue;
      customers[email].profit += revenue * 0.3;
    });
    
    return Object.values(customers)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  }

  getProfitDistribution(orders) {
    const ranges = {
      'low': { min: 0, max: 50, count: 0, total: 0 },
      'medium': { min: 50, max: 200, count: 0, total: 0 },
      'high': { min: 200, max: Infinity, count: 0, total: 0 }
    };
    
    orders.forEach(order => {
      const profit = parseFloat(order.total_price || 0) * 0.3;
      
      for (const [range, config] of Object.entries(ranges)) {
        if (profit >= config.min && profit < config.max) {
          config.count += 1;
          config.total += profit;
          break;
        }
      }
    });
    
    return ranges;
  }

  getMostProfitableProducts(orders, limit = 5) {
    return this.getProductAnalysis(orders)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, limit);
  }

  getLeastProfitableProducts(orders, limit = 5) {
    return this.getProductAnalysis(orders)
      .sort((a, b) => a.profit - b.profit)
      .slice(0, limit);
  }

  generateProductRecommendations(orders) {
    const products = this.getProductAnalysis(orders);
    const recommendations = [];
    
    products.forEach(product => {
      const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
      
      if (margin < 10) {
        recommendations.push({
          productId: product.id,
          type: 'warning',
          message: `${product.name} has low profit margin (${margin.toFixed(1)}%)`,
          action: 'review_pricing'
        });
      } else if (margin > 50) {
        recommendations.push({
          productId: product.id,
          type: 'success',
          message: `${product.name} has excellent profit margin (${margin.toFixed(1)}%)`,
          action: 'promote_product'
        });
      }
    });
    
    return recommendations;
  }

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
