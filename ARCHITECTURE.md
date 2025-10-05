# Shopify App Architecture

This Shopify app follows a clean MVC (Model-View-Controller) architecture with separate backend and frontend directories.

## Project Structure

```
ringarosesapp/
├── backend/              # Express.js backend (MVC)
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Business logic & data models
│   ├── routes/          # API route definitions
│   ├── server.js        # Entry point
│   └── package.json     # Backend dependencies
│
├── frontend/            # React frontend (SPA)
│   ├── assets/         # Static assets
│   ├── components/     # React components
│   ├── locales/        # i18n translations
│   ├── pages/          # Page components (file-based routing)
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main app component
│   ├── index.jsx       # Entry point
│   ├── vite.config.js  # Vite configuration
│   └── package.json    # Frontend dependencies
│
├── extensions/          # Shopify app extensions (if any)
├── shopify.app.toml    # Shopify app configuration
├── package.json        # Root workspace configuration
└── Dockerfile          # Docker deployment configuration
```

## Architecture Overview

### Backend (MVC Pattern)

**Models** (`backend/models/`)
- Encapsulate business logic
- Handle data operations via Shopify GraphQL/REST APIs
- Reusable across controllers
- Example: `Product.js` manages product operations

**Controllers** (`backend/controllers/`)
- Handle HTTP requests/responses
- Validate input
- Call model methods
- Return JSON responses
- Example: `productController.js` handles product endpoints

**Routes** (`backend/routes/`)
- Define API endpoints
- Map URLs to controllers
- Apply middleware (auth, validation)
- Organized by feature/resource

**Middleware** (`backend/middleware/`)
- Authentication (`auth.js`)
- Request validation
- Error handling
- Logging

**Config** (`backend/config/`)
- Shopify API setup
- Database connections
- Environment-specific settings

### Frontend (React SPA)

**Component-Based Architecture**
- Reusable UI components in `components/`
- Page components in `pages/` (file-based routing)
- Polaris design system for consistent UI

**State Management**
- React Query for server state
- React hooks for local state
- Context API for global state (Polaris, i18n)

**Routing**
- File-based routing via `Routes.jsx`
- React Router under the hood
- Convention: `pages/index.jsx` → `/`, `pages/orders.jsx` → `/orders`

**Styling**
- Shopify Polaris components
- CSS modules (if needed)

## Request Flow

### 1. User Visits App
```
User → Shopify Admin → App URL → Backend server.js
                                      ↓
                                 Check auth
                                      ↓
                                 Serve index.html
                                      ↓
                                 React app loads
```

### 2. API Request
```
Frontend Component
    ↓ (fetch/axios)
Vite Dev Proxy (dev) or Direct (prod)
    ↓
Backend Route (/api/products)
    ↓
Auth Middleware (validateSession)
    ↓
Controller (productController.js)
    ↓
Model (Product.js)
    ↓
Shopify GraphQL API
    ↓
Response back through chain
```

### 3. Webhook
```
Shopify → POST /api/webhooks → webhookController.js → Process event
```

## Key Features

### Non-Embedded App
- Set in `shopify.app.toml`: `embedded = false`
- Configured in `backend/config/shopify.js`: `isEmbeddedApp: false`
- App opens in a new tab instead of iframe

### Authentication
- OAuth 2.0 flow handled by `@shopify/shopify-app-express`
- Session storage in SQLite (`database.sqlite`)
- Middleware validates sessions on API routes

### Webhooks
- Mandatory privacy webhooks in `webhookController.js`
- CUSTOMERS_DATA_REQUEST
- CUSTOMERS_REDACT
- SHOP_REDACT

### API Design
- RESTful endpoints under `/api/*`
- JSON request/response
- Authenticated via Shopify session

## Development Workflow

### 1. Start Development Server
```bash
npm run dev
```
This starts both backend and frontend via Shopify CLI.

### 2. Make Changes

**Backend Changes:**
- Edit files in `backend/`
- Server auto-reloads (nodemon)

**Frontend Changes:**
- Edit files in `frontend/`
- Hot module replacement (HMR) via Vite

### 3. Add New Feature

**Example: Add Orders Feature**

1. **Create Model** (`backend/models/Order.js`)
```javascript
class Order {
  static async getAll(session) { /* ... */ }
}
```

2. **Create Controller** (`backend/controllers/orderController.js`)
```javascript
export const getOrders = async (req, res) { /* ... */ }
```

3. **Create Routes** (`backend/routes/orderRoutes.js`)
```javascript
router.get("/", getOrders);
```

4. **Register Routes** (`backend/routes/index.js`)
```javascript
router.use("/orders", orderRoutes);
```

5. **Create Frontend Page** (`frontend/pages/orders.jsx`)
```javascript
export default function Orders() { /* ... */ }
```

6. **Add Navigation** (`frontend/App.jsx`)
```javascript
<a href="/orders">Orders</a>
```

## Deployment

### Build Frontend
```bash
cd frontend
SHOPIFY_API_KEY=<your-key> npm run build
```

### Run Production Server
```bash
cd backend
NODE_ENV=production npm run serve
```

### Docker
```bash
docker build -t ringarosesapp .
docker run -p 3000:3000 ringarosesapp
```

## Best Practices

### Backend
- ✅ Keep controllers thin, models fat
- ✅ Use async/await for asynchronous operations
- ✅ Handle errors gracefully
- ✅ Validate input in controllers
- ✅ Use middleware for cross-cutting concerns
- ✅ Keep routes organized by resource

### Frontend
- ✅ Use Polaris components for consistency
- ✅ Keep components small and focused
- ✅ Use React Query for server state
- ✅ Implement proper error handling
- ✅ Use TypeScript for type safety (optional)
- ✅ Follow file-based routing conventions

### Security
- ✅ Never commit API keys
- ✅ Validate all user input
- ✅ Use HTTPS in production
- ✅ Implement proper CORS policies
- ✅ Keep dependencies updated

## Troubleshooting

### Backend won't start
- Check `BACKEND_PORT` environment variable
- Ensure dependencies are installed: `cd backend && npm install`
- Check for port conflicts

### Frontend won't build
- Ensure `SHOPIFY_API_KEY` is set
- Check for syntax errors in JSX files
- Clear node_modules and reinstall

### API requests fail
- Verify authentication middleware is applied
- Check session storage (database.sqlite)
- Ensure Shopify app is installed on test store

## Resources

- [Shopify App Development](https://shopify.dev/docs/apps)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Shopify Polaris](https://polaris.shopify.com/)
- [Vite Documentation](https://vitejs.dev/)
