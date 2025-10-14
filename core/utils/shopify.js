/**
 * Shopify Configuration
 * Shopify API setup and configuration
 */

import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

import { shopifyApi } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
// Import Node.js adapter
import "@shopify/shopify-api/adapters/node";

// Configure session storage
const sessionStorage = new SQLiteSessionStorage("database.sqlite");

// Debug environment variables
console.log('🔍 Environment variables check:');
console.log('SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET ? '✅ Set' : '❌ Missing');
console.log('HOST:', process.env.HOST ? '✅ Set' : '❌ Missing');

// Initialize Shopify API
const api = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_API_SHOPIFY_API_SCOPES?.split(",") || ["read_products"],
  hostName: process.env.HOST?.replace(/https?:\/\//, "") || "localhost",
  hostScheme: process.env.HOST?.includes("https") ? "https" : "http",
  apiVersion: "2024-10",
  isEmbeddedApp: false,
  sessionStorage,
  restResources,
});

// Initialize Shopify App Express
const shopify = shopifyApp({
  api,
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage,
});

// Export both the API and the app
export default shopify;
export { api };
