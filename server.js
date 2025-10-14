// @ts-check

/**
 * Shopify App Boilerplate Server
 * Clean, modular architecture with plug-and-play apps
 */

// Load environment variables FIRST
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

// Configuration
import { loadConfig, validateConfig } from "./config/index.js";

// Core modules
import setupCheck from "./core/utils/setupCheck.js";
import connectDB from "./core/db/connection.js";
import shopify, { api } from "./core/utils/shopify.js";

// Core functionality
import { initializeAuth, authRoutes } from "./core/auth/index.js";
import { BillingManager, billingRoutes } from "./core/billing/index.js";
import { WebhookManager } from "./core/webhooks/index.js";
import { GDPRManager, gdprRoutes } from "./core/gdpr/index.js";
import { initializeJobs } from "./core/jobs/index.js";

// App modules
import profitAnalyserRoutes from "./apps/profit-analyser/backend/routes/index.js";

// Run setup check
setupCheck();

console.log("🚀 Starting Shopify App Boilerplate...");

/**
 * Initialize application
 */
async function initializeApp() {
  try {
    // Load and validate configuration
    const config = loadConfig();
    validateConfig(config);

    // Connect to MongoDB
    await connectDB();

    // Initialize core services
    const services = await initializeCoreServices(config);

    // Configure Express
    const app = configureExpress(config);

    // Mount routes
    mountCoreRoutes(app, services);
    mountAppRoutes(app);

    // Configure static serving
    configureStaticServing(app);

    // Initialize background jobs
    const jobManager = initializeJobs({
      enableDefaultJobs: config.features?.background_jobs !== false,
      autoStart: process.env.NODE_ENV === 'production'
    });

    // Start server
    const PORT = config.server.port;
    app.listen(PORT, config.server.host, () => {
      console.log("🎉 ================================");
      console.log("🎉   SHOPIFY APP BOILERPLATE     ");
      console.log("🎉 ================================");
      console.log(`🚀 Server: http://${config.server.host}:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: Connected`);
      console.log(`🔧 Core modules: Loaded`);
      console.log(`🎯 Apps: Profit Analyser`);
      console.log(`⏰ Jobs: ${jobManager.listJobs().length} scheduled`);
      console.log("🎉 ================================");
    });

    // Graceful shutdown
    setupGracefulShutdown(services, jobManager);

  } catch (error) {
    console.error("❌ Failed to initialize app:", error);
    process.exit(1);
  }
}

/**
 * Initialize core services
 */
async function initializeCoreServices(config) {
  console.log("🔄 Initializing core services...");
  
  // Initialize billing manager
  const billingManager = new BillingManager(api);
  await billingManager.initializePlans();
  
  // Initialize webhook manager
  const webhookManager = new WebhookManager();
  
  // Initialize GDPR manager
  const gdprManager = new GDPRManager();
  
  console.log("✅ Core services initialized");
  
  return {
    billingManager,
    webhookManager,
    gdprManager
  };
}

/**
 * Configure Express app
 */
function configureExpress(config) {
  console.log("🔄 Configuring Express app...");
  
  const app = express();
  
  // CORS configuration
  const corsOptions = {
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning']
  };
  
  app.use(cors(corsOptions));
  
  // Security headers
  app.use((req, res, next) => {
    res.header('ngrok-skip-browser-warning', 'true');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
  });
  
  // Parse JSON bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  console.log("✅ Express app configured");
  return app;
}

/**
 * Mount core routes
 */
function mountCoreRoutes(app, services) {
  console.log("🔄 Mounting core routes...");
  
  const { billingManager, webhookManager, gdprManager } = services;
  
  // Initialize authentication
  initializeAuth(app, {
    onAuthSuccess: async (shop, session) => {
      console.log(`🎉 Auth success for shop: ${shop}`);
    },
    onAuthError: async (error, shop) => {
      console.error(`❌ Auth error for shop ${shop}:`, error);
    }
  });
  
  // Initialize webhooks
  webhookManager.initializeWebhooks(app);
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "OK", 
      message: "Shopify App Boilerplate is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: "2.0.0",
      architecture: "modular"
    });
  });
  
  // Core API routes
  app.use("/api/auth", authRoutes());
  app.use("/api/billing", billingRoutes(billingManager));
  app.use("/api/webhooks", webhookManager.createWebhookRoutes());
  app.use("/api/gdpr", gdprRoutes(gdprManager));
  
  console.log("✅ Core routes mounted");
}

/**
 * Mount app-specific routes
 */
function mountAppRoutes(app) {
  console.log(" Mounting app routes...");
  
  // Add logging middleware for profit-analyser requests
  app.use('/api/profit-analyser', (req, res, next) => {
    console.log(` [SERVER] Profit-analyser request: ${req.method} ${req.originalUrl}`);
    console.log(` [SERVER] Query params:`, req.query);
    console.log(` [SERVER] Route path:`, req.path);
    console.log(` [SERVER] Full URL:`, req.url);
    if (req.originalUrl.includes('dashboard') || req.originalUrl.includes('analytics')) {
      console.log(` [SERVER] DASHBOARD/ANALYTICS REQUEST DETECTED!`);
      console.log(` [SERVER] Headers:`, req.headers);
    }
    next();
  });
  
  // Mount profit analyser app
  app.use("/api/profit-analyser", profitAnalyserRoutes);
  
  // Add more apps here:
  // app.use("/api/email-marketing", emailMarketingRoutes);
  // app.use("/api/inventory-manager", inventoryManagerRoutes);
  
  console.log("✅ App routes mounted");
}

/**
 * Configure static file serving and SPA handling
 */
function configureStaticServing(app) {
  console.log("🔄 Configuring static serving...");
  
  const STATIC_PATH = process.env.NODE_ENV === "production" 
    ? join(process.cwd(), "public")
    : join(process.cwd(), "public");
  
  // Serve static files
  app.use(shopify.cspHeaders());
  app.use(serveStatic(STATIC_PATH, { index: false }));
  
  // API 404 handler
  app.use('/api/*', (req, res) => {
    res.status(404).json({ 
      error: 'API endpoint not found',
      availableEndpoints: [
        '/api/health',
        '/api/auth/*',
        '/api/billing/*',
        '/api/webhooks/*',
        '/api/gdpr/*',
        '/api/profit-analyser/*'
      ]
    });
  });
  
  // SPA fallback
  app.get("*", (req, res) => {
    try {
      const indexPath = join(STATIC_PATH, "index.html");
      
      if (!require('fs').existsSync(indexPath)) {
        // Redirect to frontend dev server
        const frontendUrl = process.env.VITE_SHOPIFY_APP_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}${req.url}`);
      }
      
      // Redirect root without shop to login
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
  
  console.log("✅ Static serving configured");
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown(services, jobManager) {
  const gracefulShutdown = (signal) => {
    console.log(`\n🔄 Received ${signal}, starting graceful shutdown...`);
    
    // Stop background jobs
    if (jobManager) {
      jobManager.stopAll();
    }
    
    // Close database connections, etc.
    // Add cleanup logic here
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start the application
initializeApp();
