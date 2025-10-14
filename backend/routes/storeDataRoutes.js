import express from 'express';
import { validateSession } from '../middleware/auth.js';
import shopify from '../config/shopify.js';

const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Store data routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check session status
router.get('/debug/session/:shop', async (req, res) => {
  try {
    const { shop } = req.params;
    
    console.log(`🔍 Checking session status for shop: ${shop}`);
    
    // Get the session for this shop
    const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
    
    const sessionInfo = {
      shop,
      sessionsFound: sessions?.length || 0,
      sessions: sessions?.map(s => ({
        id: s.id,
        shop: s.shop,
        isOnline: s.isOnline,
        expires: s.expires,
        hasAccessToken: !!s.accessToken,
      })) || []
    };
    
    console.log(`📋 Session info for ${shop}:`, sessionInfo);
    
    res.json(sessionInfo);
  } catch (error) {
    console.error(`❌ Error checking session for ${req.params.shop}:`, error);
    res.status(500).json({ 
      error: 'Failed to check session',
      details: error.message 
    });
  }
});

// Custom validation middleware for URL params
const validateShopSession = async (req, res, next) => {
  try {
    const shop = req.params.shop || req.query.shop;
    
    console.log('🔍 Validating session for shop:', shop);
    
    if (!shop) {
      console.log('❌ No shop parameter provided');
      return res.status(401).json({ error: 'Shop parameter is required' });
    }

    // Get the session for this shop
    const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
    
    console.log('📋 Sessions found:', sessions?.length || 0);
    
    if (!sessions || sessions.length === 0) {
      console.log('❌ No valid session found for:', shop);
      return res.status(401).json({ error: 'No valid session found for this shop' });
    }

    const session = sessions[0];
    console.log('✅ Using session:', session.id);

    // Add session to locals
    res.locals.shopify = { session };
    
    console.log('✅ Session validation successful for:', shop);
    next();
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Simple dashboard endpoint for testing
router.get('/dashboard-test/:shop', async (req, res) => {
  try {
    const { shop } = req.params;
    console.log(`🧪 Testing dashboard endpoint for shop: ${shop}`);
    
    res.json({
      shop,
      message: 'Dashboard endpoint is working',
      timestamp: new Date().toISOString(),
      mockData: {
        store: {
          name: `Test Store (${shop})`,
          domain: shop,
          currency: 'USD'
        },
        metrics: {
          products: 42,
          orders: 15,
          customers: 8
        }
      }
    });
  } catch (error) {
    console.error(`❌ Error in test dashboard:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get store dashboard data
router.get('/dashboard/:shop', validateShopSession, async (req, res) => {
  try {
    const { shop } = req.params;
    const session = res.locals.shopify.session;

    console.log(`📊 Fetching dashboard data for store: ${shop}`);
    console.log(`🔑 Session details:`, {
      id: session?.id,
      shop: session?.shop,
      hasAccessToken: !!session?.accessToken,
      isOnline: session?.isOnline
    });

    // Create REST client
    const client = new shopify.api.clients.Rest({ session });

    // Fetch store info
    const storeResponse = await client.get({
      path: 'shop',
    });

    // Fetch products count
    const productsCountResponse = await client.get({
      path: 'products/count',
    });

    // Try to fetch orders and customers, but handle permission errors gracefully
    let ordersCount = 0;
    let customersCount = 0;
    let recentOrders = [];

    try {
      const ordersCountResponse = await client.get({
        path: 'orders/count',
      });
      ordersCount = ordersCountResponse.body.count;
    } catch (error) {
      console.log(`⚠️ Cannot fetch orders count (permission required): ${error.message}`);
    }

    try {
      const customersCountResponse = await client.get({
        path: 'customers/count',
      });
      customersCount = customersCountResponse.body.count;
    } catch (error) {
      console.log(`⚠️ Cannot fetch customers count (permission required): ${error.message}`);
    }

    try {
      const recentOrdersResponse = await client.get({
        path: 'orders',
        query: { limit: 10, status: 'any' },
      });
      recentOrders = recentOrdersResponse.body.orders.map(order => ({
        id: order.id,
        name: order.name,
        total_price: order.total_price,
        currency: order.currency,
        created_at: order.created_at,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        customer: order.customer ? {
          first_name: order.customer.first_name,
          last_name: order.customer.last_name,
          email: order.customer.email,
        } : null,
      }));
    } catch (error) {
      console.log(`⚠️ Cannot fetch recent orders (permission required): ${error.message}`);
    }

    const dashboardData = {
      store: {
        name: storeResponse.body.shop.name,
        domain: storeResponse.body.shop.domain,
        email: storeResponse.body.shop.email,
        currency: storeResponse.body.shop.currency,
        timezone: storeResponse.body.shop.timezone,
        plan_name: storeResponse.body.shop.plan_name,
      },
      metrics: {
        products: productsCountResponse.body.count,
        orders: ordersCount,
        customers: customersCount,
      },
      recentOrders: recentOrders,
      permissions: {
        hasOrdersAccess: ordersCount > 0 || recentOrders.length > 0,
        hasCustomersAccess: customersCount > 0,
        hasProductsAccess: true
      }
    };

    console.log(`✅ Dashboard data fetched for ${shop}:`, {
      products: dashboardData.metrics.products,
      orders: dashboardData.metrics.orders,
      customers: dashboardData.metrics.customers,
      permissions: dashboardData.permissions
    });

    res.json(dashboardData);
  } catch (error) {
    console.error(`❌ Error fetching dashboard data for ${req.params.shop}:`, {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
      name: error.name,
      cause: error.cause
    });
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message,
      shop: req.params.shop
    });
  }
});

// Get store products
router.get('/products/:shop', validateShopSession, async (req, res) => {
  try {
    const { shop } = req.params;
    const session = res.locals.shopify.session;
    const { limit = 50, page = 1 } = req.query;

    console.log(`📦 Fetching products for store: ${shop}`);

    const client = new shopify.api.clients.Rest({ session });

    const productsResponse = await client.get({
      path: 'products',
      query: { limit, page_info: page },
    });

    const products = productsResponse.body.products.map(product => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      status: product.status,
      created_at: product.created_at,
      updated_at: product.updated_at,
      vendor: product.vendor,
      product_type: product.product_type,
      tags: product.tags,
      variants: product.variants.map(variant => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        inventory_quantity: variant.inventory_quantity,
        sku: variant.sku,
      })),
      images: product.images.map(image => ({
        id: image.id,
        src: image.src,
        alt: image.alt,
      })),
    }));

    console.log(`✅ Fetched ${products.length} products for ${shop}`);

    res.json({ products });
  } catch (error) {
    console.error(`❌ Error fetching products for ${req.params.shop}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error.message 
    });
  }
});

// Get store orders (with permission handling)
router.get('/orders/:shop', validateShopSession, async (req, res) => {
  try {
    const { shop } = req.params;
    const session = res.locals.shopify.session;
    const { limit = 50, status = 'any' } = req.query;

    console.log(`📋 Fetching orders for store: ${shop}`);

    const client = new shopify.api.clients.Rest({ session });

    try {
      const ordersResponse = await client.get({
        path: 'orders',
        query: { limit, status },
      });

      const orders = ordersResponse.body.orders.map(order => ({
        id: order.id,
        name: order.name,
        email: order.email,
        created_at: order.created_at,
        updated_at: order.updated_at,
        total_price: order.total_price,
        subtotal_price: order.subtotal_price,
        total_tax: order.total_tax,
        currency: order.currency,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        customer: order.customer ? {
          id: order.customer.id,
          first_name: order.customer.first_name,
          last_name: order.customer.last_name,
          email: order.customer.email,
        } : null,
        line_items: order.line_items.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
      }));

      console.log(`✅ Fetched ${orders.length} orders for ${shop}`);
      res.json({ orders });
      
    } catch (error) {
      console.log(`⚠️ Cannot fetch orders (permission required): ${error.message}`);
      res.status(403).json({ 
        error: 'Orders access not permitted',
        details: 'This app needs read_orders scope to access order data',
        shop: req.params.shop
      });
    }
  } catch (error) {
    console.error(`❌ Error fetching orders for ${req.params.shop}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      details: error.message 
    });
  }
});

// Get store products
router.get('/products/:shop', validateShopSession, async (req, res) => {
  try {
    const { shop } = req.params;
    const session = res.locals.shopify.session;
    const { limit = 50, page = 1 } = req.query;

    console.log(`📦 Fetching products for store: ${shop}`);

    const client = new shopify.api.clients.Rest({ session });

    const productsResponse = await client.get({
      path: 'products',
      query: { limit, page_info: page },
    });

    const products = productsResponse.body.products.map(product => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      status: product.status,
      created_at: product.created_at,
      updated_at: product.updated_at,
      vendor: product.vendor,
      product_type: product.product_type,
      tags: product.tags,
      variants: product.variants.map(variant => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        inventory_quantity: variant.inventory_quantity,
        sku: variant.sku,
      })),
      images: product.images.map(image => ({
        id: image.id,
        src: image.src,
        alt: image.alt,
      })),
    }));

    console.log(`✅ Fetched ${products.length} products for ${shop}`);

    res.json({ products });
  } catch (error) {
    console.error(`❌ Error fetching products for ${req.params.shop}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error.message 
    });
  }
});

// Get store orders
router.get('/orders/:shop', validateShopSession, async (req, res) => {
  try {
    const { shop } = req.params;
    const session = res.locals.shopify.session;
    const { limit = 50, status = 'any' } = req.query;

    console.log(`📋 Fetching orders for store: ${shop}`);

    const client = new shopify.api.clients.Rest({ session });

    const ordersResponse = await client.get({
      path: 'orders',
      query: { limit, status },
    });

    const orders = ordersResponse.body.orders.map(order => ({
      id: order.id,
      name: order.name,
      email: order.email,
      created_at: order.created_at,
      updated_at: order.updated_at,
      total_price: order.total_price,
      subtotal_price: order.subtotal_price,
      total_tax: order.total_tax,
      currency: order.currency,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      customer: order.customer ? {
        id: order.customer.id,
        first_name: order.customer.first_name,
        last_name: order.customer.last_name,
        email: order.customer.email,
      } : null,
      line_items: order.line_items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    console.log(`✅ Fetched ${orders.length} orders for ${shop}`);

    res.json({ orders });
  } catch (error) {
    console.error(`❌ Error fetching orders for ${req.params.shop}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      details: error.message 
    });
  }
});

// Get store customers
router.get('/customers/:shop', validateShopSession, async (req, res) => {
  try {
    const { shop } = req.params;
    const session = res.locals.shopify.session;
    const { limit = 50 } = req.query;

    console.log(`👥 Fetching customers for store: ${shop}`);

    const client = new shopify.api.clients.Rest({ session });

    const customersResponse = await client.get({
      path: 'customers',
      query: { limit },
    });

    const customers = customersResponse.body.customers.map(customer => ({
      id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
      orders_count: customer.orders_count,
      total_spent: customer.total_spent,
      state: customer.state,
      addresses: customer.addresses,
    }));

    console.log(`✅ Fetched ${customers.length} customers for ${shop}`);

    res.json({ customers });
  } catch (error) {
    console.error(`❌ Error fetching customers for ${req.params.shop}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch customers',
      details: error.message 
    });
  }
});

export default router;
