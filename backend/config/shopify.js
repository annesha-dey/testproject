import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import dotenv from "dotenv";
const DB_PATH = `${process.cwd()}/database.sqlite`;
dotenv.config();
// Debug: Log environment variables
console.log('Environment variables loaded:');
console.log('SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY);
console.log('SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET ? '[HIDDEN]' : 'NOT SET');
console.log('SCOPES:', process.env.SCOPES);
console.log('HOST:', process.env.HOST);

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SCOPES?.split(',') || ['write_products'],
    hostName: process.env.HOST?.replace(/https?:\/\//, '') || 'localhost',
    apiVersion: LATEST_API_VERSION,
    restResources,
    isEmbeddedApp: false,
    future: {
      customerAddressDefaultFix: true,
      lineItemBilling: true,
      unstable_managedPricingSupport: true,
    },
    billing: undefined, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  isEmbeddedApp: false,
  webhooks: {
    path: "/api/webhooks",
  },
  useOnlineTokens: false,
  // This should be replaced with your preferred storage strategy
  sessionStorage: new SQLiteSessionStorage(DB_PATH),
});

export default shopify;
