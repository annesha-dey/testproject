/**
 * Core API Module
 * Provides REST and GraphQL API wrappers for Shopify API interactions
 */

import { Session } from "@shopify/shopify-api";
import shopify from "./shopify.js";
import StoreManager from "./storeManager.js";

// Create storeManager instance
const storeManager = new StoreManager();

/**
 * REST API Client wrapper
 */
export class RestClient {
  constructor(shop, accessToken) {
    this.shop = shop;
    this.accessToken = accessToken;
    this.session = new Session({
      id: `${shop}_${Date.now()}`,
      shop: shop,
      accessToken: accessToken,
      isOnline: false,
      state: 'authenticated',
      scope: process.env.SHOPIFY_API_SCOPES || 'read_products,write_products'
    });
    this.client = new shopify.api.clients.Rest({ session: this.session });
  }

  /**
   * Create REST client for a specific shop
   */
  static async forShop(shop) {
    const accessToken = await storeManager.getAccessToken(shop);
    if (!accessToken) {
      throw new Error(`No access token found for shop: ${shop}`);
    }
    return new RestClient(shop, accessToken);
  }

  /**
   * Generic GET request
   */
  async get(path, options = {}) {
    try {
      console.log(`🔄 REST GET: ${path} for shop: ${this.shop}`);
      const response = await this.client.get({ 
        path, 
        ...options 
      });
      console.log(`✅ REST GET successful: ${path}`);
      return response;
    } catch (error) {
      console.error(`❌ REST GET failed: ${path}`, error);
      throw error;
    }
  }

  /**
   * Generic POST request
   */
  async post(path, data, options = {}) {
    try {
      console.log(`🔄 REST POST: ${path} for shop: ${this.shop}`);
      const response = await this.client.post({ 
        path, 
        data,
        type: 'application/json',
        ...options 
      });
      console.log(`✅ REST POST successful: ${path}`);
      return response;
    } catch (error) {
      console.error(`❌ REST POST error for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Generic PUT request
   */
  async put(path, data, options = {}) {
    try {
      console.log(`🔄 REST PUT: ${path} for shop: ${this.shop}`);
      const response = await this.client.put({ 
        path, 
        data,
        type: 'application/json',
        ...options 
      });
      console.log(`✅ REST PUT successful: ${path}`);
      return response;
    } catch (error) {
      console.error(`❌ REST PUT error for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Generic DELETE request
   */
  async delete(path, options = {}) {
    try {
      console.log(`🔄 REST DELETE: ${path} for shop: ${this.shop}`);
      const response = await this.client.delete({ path, ...options });
      console.log(`✅ REST DELETE successful: ${path}`);
      return response;
    } catch (error) {
      console.error(`❌ REST DELETE error for ${path}:`, error);
      throw error;
    }
  }

  // Convenience methods for common resources
  async getProducts(options = {}) {
    return this.get('products.json', options);
  }

  async getProduct(id) {
    return this.get(`products/${id}.json`);
  }

  async createProduct(productData) {
    return this.post('products.json', { product: productData });
  }

  async updateProduct(id, productData) {
    return this.put(`products/${id}.json`, { product: productData });
  }

  async deleteProduct(id) {
    return this.delete(`products/${id}.json`);
  }

  async getOrders(options = {}) {
    return this.get('orders.json', options);
  }

  async getOrder(id) {
    return this.get(`orders/${id}.json`);
  }

  async getCustomers(options = {}) {
    return this.get('customers.json', options);
  }

  async getCustomer(id) {
    return this.get(`customers/${id}.json`);
  }

  async getShop() {
    return this.get('shop.json');
  }
}

/**
 * GraphQL Client wrapper
 */
export class GraphQLClient {
  constructor(shop, accessToken) {
    this.shop = shop;
    this.accessToken = accessToken;
    this.session = new Session({
      id: `${shop}_${Date.now()}`,
      shop: shop,
      accessToken: accessToken,
      isOnline: false,
      state: 'authenticated',
      scope: process.env.SHOPIFY_API_SCOPES || 'read_products,write_products'
    });
    this.client = new shopify.api.clients.Graphql({ session: this.session });
  }

  /**
   * Create GraphQL client for a specific shop
   */
  static async forShop(shop) {
    const accessToken = await storeManager.getAccessToken(shop);
    if (!accessToken) {
      throw new Error(`No access token found for shop: ${shop}`);
    }
    return new GraphQLClient(shop, accessToken);
  }

  /**
   * Execute GraphQL query
   */
  async query(query, variables = {}) {
    try {
      console.log(`🔄 GraphQL Query for shop: ${this.shop}`);
      const response = await this.client.query({
        data: {
          query,
          variables
        }
      });
      console.log(`✅ GraphQL Query successful`);
      return response;
    } catch (error) {
      console.error(`❌ GraphQL Query error:`, error);
      throw error;
    }
  }

  /**
   * Execute GraphQL mutation
   */
  async mutate(mutation, variables = {}) {
    try {
      console.log(`🔄 GraphQL Mutation for shop: ${this.shop}`);
      const response = await this.client.query({
        data: {
          query: mutation,
          variables
        }
      });
      console.log(`✅ GraphQL Mutation successful`);
      return response;
    } catch (error) {
      console.error(`❌ GraphQL Mutation error:`, error);
      throw error;
    }
  }

  // Common GraphQL queries
  async getProductsGraphQL(first = 10, after = null) {
    const query = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              title
              handle
              status
              createdAt
              updatedAt
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                    compareAtPrice
                    inventoryQuantity
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
    return this.query(query, { first, after });
  }

  async getOrdersGraphQL(first = 10, after = null) {
    const query = `
      query getOrders($first: Int!, $after: String) {
        orders(first: $first, after: $after) {
          edges {
            node {
              id
              name
              email
              createdAt
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              lineItems(first: 10) {
                edges {
                  node {
                    id
                    title
                    quantity
                    variant {
                      id
                      title
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
    return this.query(query, { first, after });
  }
}

/**
 * API Factory - Creates appropriate client based on preference
 */
export class APIFactory {
  static async createRestClient(shop) {
    return RestClient.forShop(shop);
  }

  static async createGraphQLClient(shop) {
    return GraphQLClient.forShop(shop);
  }

  static async createClients(shop) {
    const [restClient, graphqlClient] = await Promise.all([
      RestClient.forShop(shop),
      GraphQLClient.forShop(shop)
    ]);
    
    return {
      rest: restClient,
      graphql: graphqlClient
    };
  }
}

export default {
  RestClient,
  GraphQLClient,
  APIFactory
};
