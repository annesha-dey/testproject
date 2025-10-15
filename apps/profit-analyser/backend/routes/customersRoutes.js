import express from 'express';
import Customer from '../../../../core/db/models/Customer.js';
import Order from '../../../../core/db/models/Order.js';
import { validateSession } from '../../../../core/auth/index.js';

const router = express.Router();

// Get all customers for a shop
router.get("/list", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({
        success: false,
        error: 'Shop parameter is required'
      });
    }

    console.log(`🔍 [CUSTOMERS] Fetching customers for shop: ${shop}`);

    // Fetch customers from database
    const customers = await Customer.find({ shop })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    console.log(`✅ [CUSTOMERS] Found ${customers.length} customers`);

    // Calculate metrics for each customer
    const customersWithMetrics = await Promise.all(customers.map(async (customer) => {
      // Get orders for this customer
      const customerOrders = await Order.find({ 
        shop, 
        customerId: customer.shopifyCustomerId 
      }).lean();

      let totalSpent = 0;
      let totalOrders = customerOrders.length;

      // Calculate total spent
      customerOrders.forEach(order => {
        totalSpent += parseFloat(order.totalPrice) || 0;
      });

      // Get last order date
      const lastOrderDate = customerOrders.length > 0 ? 
        new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt)))) : 
        null;

      return {
        id: customer.shopifyCustomerId,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer',
        email: customer.email || 'No email',
        phone: customer.phone || '',
        totalOrders,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        averageOrderValue: totalOrders > 0 ? parseFloat((totalSpent / totalOrders).toFixed(2)) : 0,
        lastOrderDate,
        location: customer.defaultAddress ? 
          `${customer.defaultAddress.city || ''}, ${customer.defaultAddress.country || ''}`.replace(/^,\s*|,\s*$/g, '') : 
          'Unknown',
        createdAt: customer.createdAt,
        acceptsMarketing: customer.acceptsMarketing || false,
        state: customer.state || 'enabled',
        tags: customer.tags || []
      };
    }));

    // Sort by total spent (highest first)
    customersWithMetrics.sort((a, b) => b.totalSpent - a.totalSpent);

    res.json({
      success: true,
      data: {
        customers: customersWithMetrics,
        total: customersWithMetrics.length,
        summary: {
          totalCustomers: customersWithMetrics.length,
          totalSpent: customersWithMetrics.reduce((sum, customer) => sum + customer.totalSpent, 0),
          averageCustomerValue: customersWithMetrics.length > 0 ? 
            customersWithMetrics.reduce((sum, customer) => sum + customer.totalSpent, 0) / customersWithMetrics.length : 0,
          repeatCustomers: customersWithMetrics.filter(c => c.totalOrders > 1).length
        }
      }
    });

  } catch (error) {
    console.error('❌ [CUSTOMERS] Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get customer count (for dashboard)
router.get("/count", validateSession, async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({
        success: false,
        error: 'Shop parameter is required'
      });
    }

    const count = await Customer.countDocuments({ shop });
    
    res.json({
      success: true,
      data: {
        count
      }
    });

  } catch (error) {
    console.error('❌ [CUSTOMERS] Error getting customer count:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
