# Backend - Shopify App (MVC Architecture)

This is the backend for the Shopify app, built with Express.js following the MVC (Model-View-Controller) pattern.

## Directory Structure

```
backend/
├── config/           # Configuration files
│   └── shopify.js    # Shopify API configuration
├── controllers/      # Request handlers (Controllers)
│   ├── productController.js
│   └── webhookController.js
├── middleware/       # Express middleware
│   └── auth.js       # Authentication middleware
├── models/          # Business logic and data models
│   └── Product.js    # Product model with GraphQL queries
├── routes/          # API route definitions
│   ├── index.js      # Main router
│   └── productRoutes.js
├── server.js        # Application entry point
└── package.json     # Backend dependencies
```

## MVC Pattern

### Models (`models/`)
- Contain business logic and data access
- Handle GraphQL/REST API calls to Shopify
- Example: `Product.js` handles product creation and counting

### Controllers (`controllers/`)
- Handle HTTP requests and responses
- Call model methods to perform operations
- Return JSON responses to the client
- Example: `productController.js` processes product-related requests

### Routes (`routes/`)
- Define API endpoints
- Map URLs to controller functions
- Apply middleware (authentication, validation)
- Example: `productRoutes.js` defines `/api/products/*` endpoints

## Key Files

### `server.js`
Main application entry point that:
- Sets up Express server
- Configures Shopify authentication
- Registers webhooks
- Mounts API routes
- Serves the frontend SPA

### `config/shopify.js`
Shopify API configuration:
- API version and resources
- OAuth paths
- Webhook configuration
- Session storage (SQLite)
- **Non-embedded app mode** (`isEmbeddedApp: false`)

### `middleware/auth.js`
Authentication middleware:
- `validateSession`: Validates Shopify session for API routes
- `ensureInstalled`: Ensures app is installed on the shop

## API Endpoints

### Products
- `GET /api/products/count` - Get product count
- `POST /api/products` - Create sample products

### Webhooks
- `POST /api/webhooks` - Receive Shopify webhooks

### Authentication
- `GET /api/auth` - Begin OAuth flow
- `GET /api/auth/callback` - OAuth callback

## Running the Backend

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run serve

# Debug mode
npm run debug
```

## Environment Variables

- `BACKEND_PORT` or `PORT` - Server port (default: 3000)
- `SHOPIFY_API_KEY` - Your Shopify API key
- `SHOPIFY_API_SECRET` - Your Shopify API secret
- `NODE_ENV` - Environment (development/production)

## Adding New Features

### 1. Create a Model
```javascript
// models/Order.js
class Order {
  static async getAll(session) {
    // GraphQL query logic
  }
}
export default Order;
```

### 2. Create a Controller
```javascript
// controllers/orderController.js
import Order from "../models/Order.js";

export const getOrders = async (req, res) => {
  const orders = await Order.getAll(res.locals.shopify.session);
  res.json({ orders });
};
```

### 3. Create Routes
```javascript
// routes/orderRoutes.js
import express from "express";
import { getOrders } from "../controllers/orderController.js";

const router = express.Router();
router.get("/", getOrders);
export default router;
```

### 4. Register Routes
```javascript
// routes/index.js
import orderRoutes from "./orderRoutes.js";
router.use("/orders", orderRoutes);
```

## Database

Currently uses SQLite for session storage (`database.sqlite`). For production, consider:
- PostgreSQL
- MySQL
- Redis
- MongoDB

Update `config/shopify.js` to use a different session storage adapter.
