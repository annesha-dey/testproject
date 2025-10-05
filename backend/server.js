// @ts-check

// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: join(__dirname, '.env') });

import shopify from "./config/shopify.js";
import PrivacyWebhookHandlers from "./controllers/webhookController.js";
import apiRoutes from "./routes/index.js";
import { validateSession } from "./middleware/auth.js";

console.log("process.env.SHOPIFY_API_KEY\n", process.env.SHOPIFY_API_KEY);
const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/../frontend/dist`
    : `${process.cwd()}/../frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (req, res) => {
    const { shop } = res.locals.shopify.session;
    const appUrl = process.env.SHOPIFY_APP_URL;

    // For non-embedded apps, redirect directly to frontend with shop parameter
    res.redirect(`${appUrl}?shop=${shop}`);
  }
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in frontend/vite.config.js

// Apply authentication middleware to all API routes
app.use("/api/*", validateSession);

// Parse JSON bodies
app.use(express.json());

// Mount API routes
app.use("/api", apiRoutes);

// Serve static files and handle SPA routing
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", async (_req, res, _next) => {
  res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
