import express from 'express';
import Order from '../../../../core/db/models/Order.js';
import LineItem from '../../../../core/db/models/LineItem.js';
import { validateSession } from '../../../../core/auth/index.js';

const router = express.Router();

// Get all orders for a shop
router.get("/list", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({
        success: false,
        error: 'Shop parameter is required'
      });
    }

    console.log(`🔍 [ORDERS] Fetching orders for shop: ${shop}`);

    // Fetch orders from database with line items
    const orders = await Order.find({ shop })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    console.log(`✅ [ORDERS] Found ${orders.length} orders`);

    // Calculate profit for each order
    const ordersWithProfit = await Promise.all(orders.map(async (order) => {
      // Get line items for this order
      const lineItems = await LineItem.find({ 
        shop, 
        orderId: order.shopifyOrderId 
      }).lean();

      let totalProfit = 0;
      let totalRevenue = parseFloat(order.totalPrice) || 0;

      // Calculate profit from line items
      lineItems.forEach(item => {
        const revenue = parseFloat(item.price) * parseInt(item.quantity);
        const cost = parseFloat(item.cost || 0) * parseInt(item.quantity);
        totalProfit += (revenue - cost);
      });

      const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

      return {
        id: order.shopifyOrderId,
        name: order.name,
        email: order.email,
        total: totalRevenue,
        profit: parseFloat(totalProfit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        date: order.createdAt,
        status: order.financialStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        lineItemsCount: lineItems.length,
        customer: {
          firstName: order.customerFirstName,
          lastName: order.customerLastName,
          email: order.email
        }
      };
    }));

    res.json({
      success: true,
      data: {
        orders: ordersWithProfit,
        total: ordersWithProfit.length,
        summary: {
          totalRevenue: ordersWithProfit.reduce((sum, order) => sum + order.total, 0),
          totalProfit: ordersWithProfit.reduce((sum, order) => sum + order.profit, 0),
          averageOrderValue: ordersWithProfit.length > 0 ? 
            ordersWithProfit.reduce((sum, order) => sum + order.total, 0) / ordersWithProfit.length : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ [ORDERS] Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
