# Shopify App Boilerplate

A **clean, modular, plug-and-play** Shopify app boilerplate with a scalable architecture that allows you to rapidly build and deploy multiple apps on a shared foundation.

## 🏗️ Architecture

```
shopify-boilerplate/
├── server.js                  # Entry point (wires modules, Express, MongoDB)
├── core/                      # Reusable core modules
│   ├── auth/                  # OAuth handlers & session management
│   ├── billing/               # Billing utilities & subscription logic
│   ├── gdpr/                  # GDPR compliance handlers
│   ├── webhooks/              # Webhook router & processors
│   ├── db/                    # Database schemas & models
│   ├── jobs/                  # Cron jobs & background tasks
│   └── utils/                 # Shared helpers & API wrappers
├── apps/                      # Individual app modules
│   └── profit-analyser/
│       ├── backend/           # Express routes & controllers
│       └── frontend/          # React app
├── config/                    # Environment configurations
│   ├── dev.json              # Development settings
│   └── prod.json              # Production settings
└── create-app.js              # App generator script
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment
```bash
# Copy and configure your environment variables
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Create a New App
```bash
npm run create-app email-marketing
```

## 🎯 Available Endpoints

### Core APIs
- `/api/health` - Server health check
- `/api/auth/*` - Authentication & session management
- `/api/billing/*` - Subscriptions & payment processing
- `/api/webhooks/*` - Webhook handling
- `/api/gdpr/*` - GDPR compliance endpoints

### App APIs
- `/api/profit-analyser/*` - Profit analysis features

## 🔧 Core Features

### 🔐 Authentication (`/core/auth/`)
- **Complete OAuth Flow** - Shopify app installation & authorization
- **Session Management** - Secure session handling with MongoDB
- **Logout System** - Comprehensive session cleanup
- **Middleware Protection** - `validateSession` for route protection

### 💳 Billing (`/core/billing/`)
- **Subscription Plans** - Flexible billing plan management
- **Shopify Integration** - Native recurring charge handling
- **Development Mode** - Mock billing for development stores
- **Plan Management** - Create, update, cancel subscriptions

### 🌐 API Wrappers (`/core/utils/api.js`)
- **REST Client** - Simplified Shopify REST API calls
- **GraphQL Client** - Query and mutation handling
- **Factory Pattern** - Easy client creation per shop
- **Error Handling** - Comprehensive error management

### 🔗 Webhooks (`/core/webhooks/`)
- **Default Handlers** - App uninstall, GDPR compliance
- **Extensible System** - Easy custom webhook registration
- **Automatic Verification** - Built-in Shopify webhook verification

### 📊 Database (`/core/db/`)
- **MongoDB Integration** - Robust database connection
- **Pre-built Models** - Store, BillingPlan, BillingSubscription
- **Session Storage** - Encrypted session management

### 🛡️ GDPR (`/core/gdpr/`)
- **Data Requests** - Customer data export functionality
- **Data Erasure** - Customer and shop data deletion
- **Compliance Logging** - Audit trail for GDPR requests

### ⏰ Background Jobs (`/core/jobs/`)
- **Cron Scheduling** - Built-in job scheduler
- **Default Jobs** - Session cleanup, billing sync, health checks
- **Extensible** - Easy to add custom background tasks

## 📱 Building Apps

### Create New App
```bash
npm run create-app your-app-name
```

### Add to Server
```javascript
// server.js
import yourAppRoutes from "./apps/your-app-name/backend/routes/index.js";

function mountAppRoutes(app) {
  app.use("/api/your-app-name", yourAppRoutes);
}
```

### App Structure
```
apps/your-app-name/
├── backend/
│   ├── routes/
│   │   ├── index.js
│   │   └── specificRoutes.js
│   ├── controllers/
│   │   └── YourController.js
│   └── services/
│       └── YourService.js
└── frontend/
    └── components/
```

## ⚙️ Configuration

### Development (`config/dev.json`)
```json
{
  "server": { "port": 3000 },
  "database": { "mongodb": { "uri": "mongodb://localhost:27017/app-dev" } },
  "billing": { "mock_mode": true },
  "logging": { "level": "debug" }
}
```

### Production (`config/prod.json`)
```json
{
  "server": { "port": 3000 },
  "database": { "mongodb": { "uri": "${MONGODB_URI}" } },
  "billing": { "mock_mode": false },
  "security": { "rate_limiting": true }
}
```

## 🎯 Example Apps You Can Build

- **Email Marketing** - Campaign management, templates, analytics
- **Inventory Manager** - Stock tracking, alerts, reports
- **Customer Analytics** - Behavior analysis, segmentation
- **Review Manager** - Review collection, moderation, display
- **SEO Optimizer** - Meta tags, sitemaps, performance

## 🚀 Deployment

### Build for Production
```bash
npm run serve
```

### Environment Variables
```bash
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
# ... other variables
```

## 📚 Scripts

```bash
npm run dev          # Start development server
npm run serve        # Start production server
npm run create-app   # Generate new app from template
npm run dev:legacy   # Use old server structure
```

## 🔒 Security Features

- **Session Validation** - All routes protected with valid Shopify sessions
- **GDPR Compliance** - Built-in data handling and erasure
- **Webhook Verification** - Automatic Shopify webhook verification
- **CORS Protection** - Configured for specific origins
- **Environment Security** - Secure configuration management

## 🎉 Benefits

### For Developers
- **5-minute setup** - From idea to working app
- **No boilerplate** - Focus on business logic, not infrastructure
- **Consistent patterns** - Same structure across all apps
- **Production ready** - Security, error handling, monitoring built-in

### For Businesses
- **Rapid prototyping** - Test ideas quickly
- **Scalable architecture** - Grows with your needs
- **Cost effective** - Shared infrastructure across apps
- **Maintainable** - Clean, organized codebase

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

---

**Transform your Shopify app development with this modular, scalable boilerplate. Build faster, scale easier, maintain better.** 🚀
