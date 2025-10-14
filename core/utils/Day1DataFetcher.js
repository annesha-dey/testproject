/**
 * Day 1 Data Fetcher - Fetches historical data when store installs the app
 * 
 * This utility fetches:
 * 1. Orders & Line Items (foundation of profit metrics)
 * 2. Products & Variants (cost & selling price mapping)
 * 3. Customers (LTV, retention, cohort analysis)
 * 4. Refunds (profit/margin adjustments)
 */

import { APIFactory } from './api.js';
import Order from '../db/models/Order.js';
import LineItem from '../db/models/LineItem.js';
import Product from '../db/models/Product.js';
import Customer from '../db/models/Customer.js';
import Refund from '../db/models/Refund.js';

export class Day1DataFetcher {
  constructor(shop) {
    this.shop = shop;
    this.stats = {
      orders: 0,
      lineItems: 0,
      products: 0,
      customers: 0,
      refunds: 0,
      errors: 0
    };
  }

  /**
   * Main method to fetch all historical data
   */
  async fetchAllHistoricalData() {
    console.log(`🚀 [DAY1-FETCH] Starting historical data fetch for shop: ${this.shop}`);
    
    try {
      const { rest, graphql } = await APIFactory.createClients(this.shop);
      
      // Fetch data in order of dependency
      await this.fetchProducts(rest);
      await this.fetchCustomers(rest);
      await this.fetchOrders(rest);
      await this.fetchRefunds(rest);
      
      console.log(`✅ [DAY1-FETCH] Completed historical data fetch for ${this.shop}`);
      console.log(`📊 [DAY1-FETCH] Stats:`, this.stats);
      
      return this.stats;
      
    } catch (error) {
      console.error(`❌ [DAY1-FETCH] Failed to fetch historical data for ${this.shop}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all products and variants
   */
  async fetchProducts(restClient) {
    console.log(`🔄 [DAY1-FETCH] Fetching products for ${this.shop}...`);
    
    try {
      let hasNextPage = true;
      let pageInfo = null;
      let page = 1;
      
      while (hasNextPage) {
        console.log(`📄 [DAY1-FETCH] Fetching products page ${page}...`);
        
        const params = {
          limit: 250, // Maximum allowed by Shopify
          fields: 'id,title,handle,description,vendor,product_type,tags,status,images,variants,created_at,updated_at,published_at'
        };
        
        if (pageInfo) {
          params.page_info = pageInfo;
        }
        
        const response = await restClient.get('products.json', params);
        const products = response.body?.products || response.products || [];
        
        console.log(`📦 [DAY1-FETCH] Processing ${products.length} products from page ${page}...`);
        
        for (const shopifyProduct of products) {
          await this.saveProduct(shopifyProduct);
        }
        
        // Check for pagination
        hasNextPage = products.length === 250;
        if (hasNextPage && response.body?.products) {
          // Extract page info from Link header if available
          pageInfo = this.extractPageInfo(response.headers?.link);
        } else {
          hasNextPage = false;
        }
        
        page++;
      }
      
      console.log(`✅ [DAY1-FETCH] Products fetch completed. Total: ${this.stats.products}`);
      
    } catch (error) {
      console.error(`❌ [DAY1-FETCH] Error fetching products:`, error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Fetch all customers
   */
  async fetchCustomers(restClient) {
    console.log(`🔄 [DAY1-FETCH] Fetching customers for ${this.shop}...`);
    
    try {
      let hasNextPage = true;
      let pageInfo = null;
      let page = 1;
      
      while (hasNextPage) {
        console.log(`📄 [DAY1-FETCH] Fetching customers page ${page}...`);
        
        const params = {
          limit: 250,
          fields: 'id,email,first_name,last_name,phone,default_address,state,accepts_marketing,accepts_marketing_updated_at,orders_count,total_spent,tags,note,created_at,updated_at'
        };
        
        if (pageInfo) {
          params.page_info = pageInfo;
        }
        
        const response = await restClient.get('customers.json', params);
        const customers = response.body?.customers || response.customers || [];
        
        console.log(`👥 [DAY1-FETCH] Processing ${customers.length} customers from page ${page}...`);
        
        for (const shopifyCustomer of customers) {
          await this.saveCustomer(shopifyCustomer);
        }
        
        hasNextPage = customers.length === 250;
        if (hasNextPage && response.body?.customers) {
          pageInfo = this.extractPageInfo(response.headers?.link);
        } else {
          hasNextPage = false;
        }
        
        page++;
      }
      
      console.log(`✅ [DAY1-FETCH] Customers fetch completed. Total: ${this.stats.customers}`);
      
    } catch (error) {
      console.error(`❌ [DAY1-FETCH] Error fetching customers:`, error);
      this.stats.errors++;
      // Don't throw - customers might not be accessible
    }
  }

  /**
   * Fetch all orders and line items
   */
  async fetchOrders(restClient) {
    console.log(`🔄 [DAY1-FETCH] Fetching orders for ${this.shop}...`);
    
    try {
      let hasNextPage = true;
      let pageInfo = null;
      let page = 1;
      
      while (hasNextPage) {
        console.log(`📄 [DAY1-FETCH] Fetching orders page ${page}...`);
        
        const params = {
          limit: 250,
          status: 'any',
          fields: 'id,order_number,name,email,total_price,subtotal_price,total_tax,total_discounts,currency,financial_status,fulfillment_status,customer,line_items,tags,note,source_url,created_at,updated_at,processed_at'
        };
        
        if (pageInfo) {
          params.page_info = pageInfo;
        }
        
        const response = await restClient.get('orders.json', params);
        const orders = response.body?.orders || response.orders || [];
        
        console.log(`🛒 [DAY1-FETCH] Processing ${orders.length} orders from page ${page}...`);
        
        for (const shopifyOrder of orders) {
          await this.saveOrder(shopifyOrder);
        }
        
        hasNextPage = orders.length === 250;
        if (hasNextPage && response.body?.orders) {
          pageInfo = this.extractPageInfo(response.headers?.link);
        } else {
          hasNextPage = false;
        }
        
        page++;
      }
      
      console.log(`✅ [DAY1-FETCH] Orders fetch completed. Total: ${this.stats.orders}, Line Items: ${this.stats.lineItems}`);
      
    } catch (error) {
      console.error(`❌ [DAY1-FETCH] Error fetching orders:`, error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Fetch all refunds
   */
  async fetchRefunds(restClient) {
    console.log(`🔄 [DAY1-FETCH] Fetching refunds for ${this.shop}...`);
    
    try {
      // First get all orders to fetch refunds for each
      const orders = await Order.find({ shop: this.shop }).select('shopifyOrderId');
      
      console.log(`🔍 [DAY1-FETCH] Checking refunds for ${orders.length} orders...`);
      
      for (const order of orders) {
        try {
          const response = await restClient.get(`orders/${order.shopifyOrderId}/refunds.json`);
          const refunds = response.body?.refunds || response.refunds || [];
          
          for (const shopifyRefund of refunds) {
            await this.saveRefund(shopifyRefund, order.shopifyOrderId);
          }
          
        } catch (refundError) {
          // Skip individual order refund errors
          console.log(`⚠️ [DAY1-FETCH] Could not fetch refunds for order ${order.shopifyOrderId}:`, refundError.message);
        }
      }
      
      console.log(`✅ [DAY1-FETCH] Refunds fetch completed. Total: ${this.stats.refunds}`);
      
    } catch (error) {
      console.error(`❌ [DAY1-FETCH] Error fetching refunds:`, error);
      this.stats.errors++;
      // Don't throw - refunds are not critical
    }
  }

  /**
   * Save product to database
   */
  async saveProduct(shopifyProduct) {
    try {
      const productData = {
        shopifyProductId: shopifyProduct.id.toString(),
        shop: this.shop,
        title: shopifyProduct.title,
        handle: shopifyProduct.handle,
        description: shopifyProduct.body_html,
        vendor: shopifyProduct.vendor,
        productType: shopifyProduct.product_type,
        tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map(tag => tag.trim()) : [],
        status: shopifyProduct.status,
        images: shopifyProduct.images?.map(img => ({
          src: img.src,
          alt: img.alt,
          position: img.position
        })) || [],
        variants: shopifyProduct.variants?.map(variant => ({
          shopifyVariantId: variant.id.toString(),
          title: variant.title,
          price: parseFloat(variant.price || 0),
          compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
          sku: variant.sku,
          inventoryQuantity: variant.inventory_quantity || 0,
          inventoryPolicy: variant.inventory_policy,
          inventoryManagement: variant.inventory_management,
          weight: variant.weight,
          weightUnit: variant.weight_unit,
          requiresShipping: variant.requires_shipping,
          taxable: variant.taxable
        })) || [],
        seoTitle: shopifyProduct.seo_title,
        seoDescription: shopifyProduct.seo_description,
        createdAt: new Date(shopifyProduct.created_at),
        updatedAt: new Date(shopifyProduct.updated_at),
        publishedAt: shopifyProduct.published_at ? new Date(shopifyProduct.published_at) : null
      };

      await Product.findOneAndUpdate(
        { shop: this.shop, shopifyProductId: productData.shopifyProductId },
        productData,
        { upsert: true, new: true }
      );

      this.stats.products++;
      
    } catch (error) {
      console.error(`❌ [DAY1-FETCH] Error saving product ${shopifyProduct.id}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Save customer to database
   */
  async saveCustomer(shopifyCustomer) {
    try {
      const customerData = {
        shopifyCustomerId: shopifyCustomer.id.toString(),
        shop: this.shop,
        email: shopifyCustomer.email,
        firstName: shopifyCustomer.first_name,
        lastName: shopifyCustomer.last_name,
        phone: shopifyCustomer.phone,
        defaultAddress: shopifyCustomer.default_address ? {
          address1: shopifyCustomer.default_address.address1,
          address2: shopifyCustomer.default_address.address2,
          city: shopifyCustomer.default_address.city,
          province: shopifyCustomer.default_address.province,
          country: shopifyCustomer.default_address.country,
          zip: shopifyCustomer.default_address.zip,
          countryCode: shopifyCustomer.default_address.country_code,
          provinceCode: shopifyCustomer.default_address.province_code
        } : null,
        state: shopifyCustomer.state,
        acceptsMarketing: shopifyCustomer.accepts_marketing,
        acceptsMarketingUpdatedAt: shopifyCustomer.accepts_marketing_updated_at ? 
          new Date(shopifyCustomer.accepts_marketing_updated_at) : null,
        ordersCount: shopifyCustomer.orders_count || 0,
        totalSpent: parseFloat(shopifyCustomer.total_spent || 0),
        tags: shopifyCustomer.tags ? shopifyCustomer.tags.split(',').map(tag => tag.trim()) : [],
        note: shopifyCustomer.note,
        createdAt: new Date(shopifyCustomer.created_at),
        updatedAt: new Date(shopifyCustomer.updated_at)
      };

      const customer = await Customer.findOneAndUpdate(
        { shop: this.shop, shopifyCustomerId: customerData.shopifyCustomerId },
        customerData,
        { upsert: true, new: true }
      );

      // Calculate LTV and segment
      customer.calculateLTV();
      customer.updateSegment();
      await customer.save();

      this.stats.customers++;
      
    } catch (error) {
      console.error(`❌ [DAY1-FETCH] Error saving customer ${shopifyCustomer.id}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Save order and line items to database
   */
  async saveOrder(shopifyOrder) {
    try {
      const orderData = {
        shopifyOrderId: shopifyOrder.id.toString(),
        shop: this.shop,
        orderNumber: shopifyOrder.order_number,
        name: shopifyOrder.name,
        email: shopifyOrder.email,
        totalPrice: parseFloat(shopifyOrder.total_price || 0),
        subtotalPrice: parseFloat(shopifyOrder.subtotal_price || 0),
        totalTax: parseFloat(shopifyOrder.total_tax || 0),
        totalDiscounts: parseFloat(shopifyOrder.total_discounts || 0),
        currency: shopifyOrder.currency,
        financialStatus: shopifyOrder.financial_status,
        fulfillmentStatus: shopifyOrder.fulfillment_status,
        customerId: shopifyOrder.customer?.id?.toString(),
        customerEmail: shopifyOrder.customer?.email,
        tags: shopifyOrder.tags ? shopifyOrder.tags.split(',').map(tag => tag.trim()) : [],
        note: shopifyOrder.note,
        sourceUrl: shopifyOrder.source_url,
        createdAt: new Date(shopifyOrder.created_at),
        updatedAt: new Date(shopifyOrder.updated_at),
        processedAt: shopifyOrder.processed_at ? new Date(shopifyOrder.processed_at) : null
      };

      const order = await Order.findOneAndUpdate(
        { shop: this.shop, shopifyOrderId: orderData.shopifyOrderId },
        orderData,
        { upsert: true, new: true }
      );

      this.stats.orders++;

      // Save line items
      if (shopifyOrder.line_items && shopifyOrder.line_items.length > 0) {
        for (const lineItem of shopifyOrder.line_items) {
          await this.saveLineItem(lineItem, shopifyOrder.id.toString());
        }
      }
      
    } catch (error) {
      console.error(`❌ [DAY1-FETCH] Error saving order ${shopifyOrder.id}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Save line item to database
   */
  async saveLineItem(shopifyLineItem, shopifyOrderId) {
    try {
      const lineItemData = {
        shopifyLineItemId: shopifyLineItem.id.toString(),
        shopifyOrderId: shopifyOrderId,
        shopifyProductId: shopifyLineItem.product_id?.toString(),
        shopifyVariantId: shopifyLineItem.variant_id?.toString(),
        shop: this.shop,
        title: shopifyLineItem.title,
        variantTitle: shopifyLineItem.variant_title,
        sku: shopifyLineItem.sku,
        vendor: shopifyLineItem.vendor,
        productType: shopifyLineItem.product_type,
        quantity: shopifyLineItem.quantity,
        price: parseFloat(shopifyLineItem.price || 0),
        totalDiscount: parseFloat(shopifyLineItem.total_discount || 0),
        weight: shopifyLineItem.grams,
        requiresShipping: shopifyLineItem.requires_shipping,
        taxable: shopifyLineItem.taxable,
        fulfillmentStatus: shopifyLineItem.fulfillment_status || 'unfulfilled',
        fulfillmentService: shopifyLineItem.fulfillment_service,
        properties: shopifyLineItem.properties?.map(prop => ({
          name: prop.name,
          value: prop.value
        })) || []
      };

      await LineItem.findOneAndUpdate(
        { shop: this.shop, shopifyLineItemId: lineItemData.shopifyLineItemId },
        lineItemData,
        { upsert: true, new: true }
      );

      this.stats.lineItems++;
      
    } catch (error) {
      console.error(`❌ [DAY1-FETCH] Error saving line item ${shopifyLineItem.id}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Save refund to database
   */
  async saveRefund(shopifyRefund, shopifyOrderId) {
    try {
      const refundData = {
        shopifyRefundId: shopifyRefund.id.toString(),
        shopifyOrderId: shopifyOrderId,
        shop: this.shop,
        note: shopifyRefund.note,
        refundLineItems: shopifyRefund.refund_line_items?.map(item => ({
          shopifyLineItemId: item.line_item_id?.toString(),
          quantity: item.quantity,
          restockType: item.restock_type,
          subtotal: parseFloat(item.subtotal || 0),
          totalTax: parseFloat(item.total_tax || 0),
          lineItem: {
            id: item.line_item?.id?.toString(),
            productId: item.line_item?.product_id?.toString(),
            variantId: item.line_item?.variant_id?.toString(),
            title: item.line_item?.title,
            variantTitle: item.line_item?.variant_title,
            sku: item.line_item?.sku,
            price: parseFloat(item.line_item?.price || 0)
          }
        })) || [],
        transactions: shopifyRefund.transactions?.map(transaction => ({
          shopifyTransactionId: transaction.id?.toString(),
          amount: parseFloat(transaction.amount || 0),
          currency: transaction.currency,
          kind: transaction.kind,
          gateway: transaction.gateway,
          status: transaction.status,
          processedAt: transaction.processed_at ? new Date(transaction.processed_at) : null
        })) || [],
        createdAt: new Date(shopifyRefund.created_at),
        processedAt: shopifyRefund.processed_at ? new Date(shopifyRefund.processed_at) : null
      };

      const refund = await Refund.findOneAndUpdate(
        { shop: this.shop, shopifyRefundId: refundData.shopifyRefundId },
        refundData,
        { upsert: true, new: true }
      );

      // Calculate totals and profit impact
      refund.calculateTotals();
      refund.calculateProfitImpact();
      await refund.save();

      this.stats.refunds++;
      
    } catch (error) {
      console.error(`❌ [DAY1-FETCH] Error saving refund ${shopifyRefund.id}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Extract page info from Link header for pagination
   */
  extractPageInfo(linkHeader) {
    if (!linkHeader) return null;
    
    const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    if (nextMatch) {
      const url = new URL(nextMatch[1]);
      return url.searchParams.get('page_info');
    }
    
    return null;
  }
}

export default Day1DataFetcher;
