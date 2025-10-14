import Store from "../db/models/Store.js";
import Cryptr from "cryptr";

class StoreManager {
  constructor() {
    this.cryption = new Cryptr(process.env.ENCRYPTION_STRING);
  }

  /**
   * Store or update shop information after OAuth
   */
  async storeShopData(session) {
    try {
      const storeData = {
        shop: session.shop,
        shopifyDomain: session.shop,
        accessToken: this.cryption.encrypt(session.accessToken),
        scope: session.scope,
        isActive: true,
        lastAccessedAt: new Date()
      };

      const store = await Store.findOneAndUpdate(
        { shop: session.shop },
        storeData,
        { upsert: true, new: true }
      );

      console.log(`🏪 Store data saved for: ${session.shop}`);
      return store;
    } catch (error) {
      console.error(`❌ Error storing shop data for ${session.shop}:`, error);
      throw error;
    }
  }

  /**
   * Get store information by shop domain
   */
  async getStore(shop) {
    try {
      const store = await Store.findOne({ shop, isActive: true });
      if (!store) {
        console.log(`❌ No active store found for: ${shop}`);
        return null;
      }

      // Update last accessed time
      await store.updateLastAccessed();
      
      console.log(`✅ Store data retrieved for: ${shop}`);
      return store;
    } catch (error) {
      console.error(`❌ Error retrieving store data for ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Get decrypted access token for a shop
   */
  async getAccessToken(shop) {
    try {
      console.log(`🔍 StoreManager: Starting access token retrieval for ${shop}`);
      
      console.log(`📊 Database query: Finding store with shop=${shop} and isActive=true`);
      const store = await this.getStore(shop);
      
      if (!store) {
        console.log(`❌ StoreManager: No active store found for ${shop}`);
        return null;
      }

      console.log(`✅ StoreManager: Store found for ${shop}:`, {
        shop: store.shop,
        shopifyDomain: store.shopifyDomain,
        hasAccessToken: !!store.accessToken,
        encryptedTokenLength: store.accessToken?.length,
        scope: store.scope,
        isActive: store.isActive,
        lastAccessedAt: store.lastAccessedAt,
        day1DataSynced: store.day1DataSynced
      });

      console.log(`🔓 StoreManager: Decrypting access token...`);
      const decryptedToken = this.cryption.decrypt(store.accessToken);
      
      console.log(`✅ StoreManager: Access token decrypted successfully:`, {
        tokenLength: decryptedToken?.length,
        tokenPrefix: decryptedToken?.substring(0, 10),
        tokenType: decryptedToken?.startsWith('shpua_') ? 'User Access Token' : 
                   decryptedToken?.startsWith('shpat_') ? 'App Access Token' : 'Unknown Type'
      });
      
      return decryptedToken;
    } catch (error) {
      console.error(`❌ StoreManager: Error getting access token for ${shop}:`, {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3),
        name: error.name
      });
      throw error;
    }
  }

  /**
   * Get all active stores
   */
  async getAllActiveStores() {
    try {
      const stores = await Store.find({ isActive: true }).select('-accessToken');
      console.log(`📊 Retrieved ${stores.length} active stores`);
      return stores;
    } catch (error) {
      console.error(`❌ Error retrieving active stores:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a store (soft delete)
   */
  async deactivateStore(shop) {
    try {
      const store = await Store.findOneAndUpdate(
        { shop },
        { isActive: false },
        { new: true }
      );

      if (store) {
        console.log(`🚫 Store deactivated: ${shop}`);
      } else {
        console.log(`❌ Store not found for deactivation: ${shop}`);
      }

      return store;
    } catch (error) {
      console.error(`❌ Error deactivating store ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Handle app reinstallation - clean up existing data
   */
  async handleReinstallation(shop) {
    try {
      // First check if store exists
      const existingStore = await Store.findOne({ shop });
      
      if (existingStore) {
        console.log(`🔄 Handling reinstallation for: ${shop}`);
        
        // Deactivate existing store record
        await this.deactivateStore(shop);
        
        // Clean up any existing sessions for this shop
        // This helps prevent session conflicts during reinstallation
        console.log(`🧹 Cleaned up existing data for: ${shop}`);
        
        return true; // Indicates this was a reinstallation
      }
      
      return false; // New installation
    } catch (error) {
      console.error(`❌ Error handling reinstallation for ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Update store settings
   */
  async updateStoreSettings(shop, settings) {
    try {
      const store = await Store.findOneAndUpdate(
        { shop, isActive: true },
        { 
          'appMetadata.settings': settings,
          lastAccessedAt: new Date()
        },
        { new: true }
      );

      if (store) {
        console.log(`⚙️ Settings updated for store: ${shop}`);
      }

      return store;
    } catch (error) {
      console.error(`❌ Error updating settings for ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Create Shopify API client for a specific store
   */
  async createShopifyClient(shop) {
    try {
      const accessToken = await this.getAccessToken(shop);
      if (!accessToken) {
        throw new Error(`No access token found for shop: ${shop}`);
      }

      // Return configuration object for Shopify API client
      return {
        shop: shop,
        accessToken: accessToken,
        apiVersion: process.env.SHOPIFY_API_VERSION || '2024-10'
      };
    } catch (error) {
      console.error(`❌ Error creating Shopify client for ${shop}:`, error);
      throw error;
    }
  }

  /**
   * Update store information
   */
  async updateStore(shop, updateData) {
    try {
      const store = await Store.findOneAndUpdate(
        { shop },
        { ...updateData, lastAccessedAt: new Date() },
        { new: true }
      );
      
      if (store) {
        console.log(`✅ StoreManager: Store updated for ${shop}:`, Object.keys(updateData));
      } else {
        console.log(`❌ StoreManager: Store not found for update: ${shop}`);
      }
      
      return store;
    } catch (error) {
      console.error(`❌ StoreManager: Error updating store for ${shop}:`, error);
      throw error;
    }
  }
}

export default StoreManager;
