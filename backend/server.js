// @ts-check

// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: join(__dirname, '.env') });

import setupCheck from "./utils/setupCheck.js";
import connectDB from "./config/database.js";
import shopify from "./config/shopify.js";
import PrivacyWebhookHandlers from "./controllers/webhookController.js";
import apiRoutes from "./routes/index.js";
import { validateSession } from "./middleware/auth.js";
import StoreManager from "./utils/storeManager.js";

// Run setup check before initializing anything else
setupCheck();

console.log("process.env.SHOPIFY_API_KEY\n", process.env.SHOPIFY_API_KEY);
const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/public`
    : `${process.cwd()}/public`;

// Connect to MongoDB
await connectDB();

// Initialize store manager and billing manager
const storeManager = new StoreManager();
const { default: BillingManager } = await import("./utils/billingManager.js");
const billingManager = new BillingManager(shopify.api);

// Initialize billing plans
await billingManager.initializePlans();

// Create Express app
const app = express();

// CORS configuration for multiple origins
const corsOptions = {
  origin: [
    'https://228c4be010cb.ngrok-free.app',
    'https://e43e420e9e45.ngrok-free.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning']
};

app.use(cors(corsOptions));

// Add ngrok-specific headers to bypass browser warning
app.use((req, res, next) => {
  res.header('ngrok-skip-browser-warning', 'true');
  next();
});

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (req, res) => {
    const { shop } = res.locals.shopify.session;
    const appUrl = process.env.SHOPIFY_APP_URL;

    // Handle reinstallation properly
    try {
      const isReinstallation = await storeManager.handleReinstallation(shop);
      
      if (isReinstallation) {
        console.log(`🔄 App reinstallation completed for: ${shop}`);
      } else {
        console.log(`🆕 New app installation for: ${shop}`);
      }

      // Store fresh shop data
      await storeManager.storeShopData(res.locals.shopify.session);
      console.log(`🎉 OAuth completed and store data saved for: ${shop}`);
    } catch (error) {
      console.error(`❌ Error handling OAuth for ${shop}:`, error);
      // Continue with redirect even if there's an error to avoid breaking the flow
    }

    // For non-embedded apps, redirect directly to frontend home page with shop parameter
    const frontendUrl = process.env.VITE_SHOPIFY_APP_URL || appUrl;
    res.redirect(`${frontendUrl}/home?shop=${shop}`);
  }
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in frontend/vite.config.js

// Parse JSON bodies first
app.use(express.json());

// Add a simple test route
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Backend server is running",
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Mount API routes
app.use("/api", apiRoutes);

// Serve static files and handle SPA routing
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Handle frontend routes (SPA fallback)
app.get("*", (req, res) => {
  try {
    const indexPath = join(STATIC_PATH, "index.html");
    const indexExists = require('fs').existsSync(indexPath);
    
    if (!indexExists) {
      // If no built frontend, redirect to frontend development server
      const frontendUrl = process.env.VITE_SHOPIFY_APP_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}${req.url}`);
    }
    
    // If accessing root without shop parameter, redirect to login
    if (req.path === '/' && !req.query.shop) {
      const frontendUrl = process.env.VITE_SHOPIFY_APP_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login`);
    }
    
    res
      .status(200)
      .set("Content-Type", "text/html")
      .send(
        readFileSync(indexPath)
          .toString()
          .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
      );
  } catch (error) {
    console.error('Error serving frontend:', error);
    const frontendUrl = process.env.VITE_SHOPIFY_APP_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}${req.url}`);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 CORS configured for multiple origins`);
  console.log(`🔧 Billing system updated with Session constructor`);
});
