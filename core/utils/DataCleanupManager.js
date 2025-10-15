/**
 * Data Cleanup Manager
 * 
 * Handles complete data deletion when a store uninstalls the app.
 * Ensures data privacy and compliance by removing all store-related data.
 */

import Order from '../db/models/Order.js';
import LineItem from '../db/models/LineItem.js';
import Product from '../db/models/Product.js';
import Customer from '../db/models/Customer.js';
import Refund from '../db/models/Refund.js';
import Store from '../db/models/Store.js';

export class DataCleanupManager {
  constructor(shop) {
    this.shop = shop;
    this.deletionStats = {
      orders: 0,
      lineItems: 0,
      products: 0,
      customers: 0,
      refunds: 0,
      stores: 0,
      errors: 0
    };
  }

  /**
   * Execute complete data cleanup for a shop
   */
  async executeCompleteCleanup() {
    console.log(`🗑️ [CLEANUP] Starting complete data cleanup for shop: ${this.shop}`);
    
    const startTime = Date.now();
    
    try {
      // First, get counts before deletion for logging
      await this.logDataCounts();
      
      // Delete all collections in dependency order (reverse of creation)
      await this.deleteRefunds();
      await this.deleteLineItems();
      await this.deleteOrders();
      await this.deleteCustomers();
      await this.deleteProducts();
      await this.deleteStoreData();
      
      const duration = Date.now() - startTime;
      const durationSeconds = Math.round(duration / 1000);
      
      console.log(`✅ [CLEANUP] Complete data cleanup finished for ${this.shop} in ${durationSeconds} seconds`);
      console.log(`📊 [CLEANUP] Deletion summary:`, this.deletionStats);
      
      return {
        success: true,
        stats: this.deletionStats,
        duration: durationSeconds
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const durationSeconds = Math.round(duration / 1000);
      
      console.error(`❌ [CLEANUP] Data cleanup failed for ${this.shop} after ${durationSeconds} seconds:`, error);
      console.error(`❌ [CLEANUP] Error stack:`, error.stack);
      
      return {
        success: false,
        error: error.message,
        stats: this.deletionStats,
        duration: durationSeconds
      };
    }
  }

  /**
   * Log data counts before deletion
   */
  async logDataCounts() {
    console.log(`🔍 [CLEANUP] Checking data counts before deletion for ${this.shop}...`);
    
    try {
      const [orderCount, lineItemCount, productCount, customerCount, refundCount, storeCount] = await Promise.all([
        Order.countDocuments({ shop: this.shop }),
        LineItem.countDocuments({ shop: this.shop }),
        Product.countDocuments({ shop: this.shop }),
        Customer.countDocuments({ shop: this.shop }),
        Refund.countDocuments({ shop: this.shop }),
        Store.countDocuments({ shop: this.shop })
      ]);
      
      console.log(`📊 [CLEANUP] Data to be deleted:`);
      console.log(`   - Orders: ${orderCount}`);
      console.log(`   - Line Items: ${lineItemCount}`);
      console.log(`   - Products: ${productCount}`);
      console.log(`   - Customers: ${customerCount}`);
      console.log(`   - Refunds: ${refundCount}`);
      console.log(`   - Store Records: ${storeCount}`);
      
    } catch (error) {
      console.error(`❌ [CLEANUP] Error checking data counts:`, error);
    }
  }

  /**
   * Delete all refunds for the shop
   */
  async deleteRefunds() {
    console.log(`🗑️ [CLEANUP] Deleting refunds for ${this.shop}...`);
    
    try {
      const result = await Refund.deleteMany({ shop: this.shop });
      this.deletionStats.refunds = result.deletedCount;
      console.log(`✅ [CLEANUP] Deleted ${result.deletedCount} refunds`);
      
    } catch (error) {
      console.error(`❌ [CLEANUP] Error deleting refunds:`, error);
      this.deletionStats.errors++;
    }
  }

  /**
   * Delete all line items for the shop
   */
  async deleteLineItems() {
    console.log(`🗑️ [CLEANUP] Deleting line items for ${this.shop}...`);
    
    try {
      const result = await LineItem.deleteMany({ shop: this.shop });
      this.deletionStats.lineItems = result.deletedCount;
      console.log(`✅ [CLEANUP] Deleted ${result.deletedCount} line items`);
      
    } catch (error) {
      console.error(`❌ [CLEANUP] Error deleting line items:`, error);
      this.deletionStats.errors++;
    }
  }

  /**
   * Delete all orders for the shop
   */
  async deleteOrders() {
    console.log(`🗑️ [CLEANUP] Deleting orders for ${this.shop}...`);
    
    try {
      const result = await Order.deleteMany({ shop: this.shop });
      this.deletionStats.orders = result.deletedCount;
      console.log(`✅ [CLEANUP] Deleted ${result.deletedCount} orders`);
      
    } catch (error) {
      console.error(`❌ [CLEANUP] Error deleting orders:`, error);
      this.deletionStats.errors++;
    }
  }

  /**
   * Delete all customers for the shop
   */
  async deleteCustomers() {
    console.log(`🗑️ [CLEANUP] Deleting customers for ${this.shop}...`);
    
    try {
      const result = await Customer.deleteMany({ shop: this.shop });
      this.deletionStats.customers = result.deletedCount;
      console.log(`✅ [CLEANUP] Deleted ${result.deletedCount} customers`);
      
    } catch (error) {
      console.error(`❌ [CLEANUP] Error deleting customers:`, error);
      this.deletionStats.errors++;
    }
  }

  /**
   * Delete all products for the shop
   */
  async deleteProducts() {
    console.log(`🗑️ [CLEANUP] Deleting products for ${this.shop}...`);
    
    try {
      const result = await Product.deleteMany({ shop: this.shop });
      this.deletionStats.products = result.deletedCount;
      console.log(`✅ [CLEANUP] Deleted ${result.deletedCount} products`);
      
    } catch (error) {
      console.error(`❌ [CLEANUP] Error deleting products:`, error);
      this.deletionStats.errors++;
    }
  }

  /**
   * Delete store data and sessions
   */
  async deleteStoreData() {
    console.log(`🗑️ [CLEANUP] Deleting store data for ${this.shop}...`);
    
    try {
      // Delete store record
      const storeResult = await Store.deleteMany({ shop: this.shop });
      this.deletionStats.stores = storeResult.deletedCount;
      console.log(`✅ [CLEANUP] Deleted ${storeResult.deletedCount} store records`);
      
      // TODO: Delete Shopify sessions if using session storage
      // This depends on your session storage implementation
      await this.deleteShopifySessions();
      
    } catch (error) {
      console.error(`❌ [CLEANUP] Error deleting store data:`, error);
      this.deletionStats.errors++;
    }
  }

  /**
   * Delete Shopify sessions for the shop
   */
  async deleteShopifySessions() {
    console.log(`🗑️ [CLEANUP] Deleting Shopify sessions for ${this.shop}...`);
    
    try {
      // If you're using MongoDB session storage, delete sessions
      // This is optional depending on your session storage strategy
      
      // Example for MongoDB session storage:
      // const sessionResult = await mongoose.connection.db.collection('sessions')
      //   .deleteMany({ shop: this.shop });
      // console.log(`✅ [CLEANUP] Deleted ${sessionResult.deletedCount} sessions`);
      
      console.log(`ℹ️ [CLEANUP] Session cleanup skipped (implement based on your session storage)`);
      
    } catch (error) {
      console.error(`❌ [CLEANUP] Error deleting sessions:`, error);
      this.deletionStats.errors++;
    }
  }

  /**
   * Verify all data has been deleted
   */
  async verifyCleanup() {
    console.log(`🔍 [CLEANUP] Verifying cleanup completion for ${this.shop}...`);
    
    try {
      const [orderCount, lineItemCount, productCount, customerCount, refundCount, storeCount] = await Promise.all([
        Order.countDocuments({ shop: this.shop }),
        LineItem.countDocuments({ shop: this.shop }),
        Product.countDocuments({ shop: this.shop }),
        Customer.countDocuments({ shop: this.shop }),
        Refund.countDocuments({ shop: this.shop }),
        Store.countDocuments({ shop: this.shop })
      ]);
      
      const totalRemaining = orderCount + lineItemCount + productCount + customerCount + refundCount + storeCount;
      
      if (totalRemaining === 0) {
        console.log(`✅ [CLEANUP] Verification successful: All data deleted for ${this.shop}`);
        return true;
      } else {
        console.error(`❌ [CLEANUP] Verification failed: ${totalRemaining} records still exist for ${this.shop}`);
        console.error(`❌ [CLEANUP] Remaining: Orders(${orderCount}), LineItems(${lineItemCount}), Products(${productCount}), Customers(${customerCount}), Refunds(${refundCount}), Stores(${storeCount})`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ [CLEANUP] Error during verification:`, error);
      return false;
    }
  }
}

export default DataCleanupManager;
