import shopify from "../config/shopify.js";
import StoreManager from "../utils/storeManager.js";

const storeManager = new StoreManager();

/**
 * Middleware to validate authenticated session for API routes
 * For non-embedded apps with multi-store support
 */
export const validateSession = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    
    console.log('🔍 Validating session for shop:', shop);
    
    if (!shop) {
      console.log('❌ No shop parameter provided');
      return res.status(401).json({ error: 'Shop parameter is required' });
    }

    // Get store data and validate access token
    const store = await storeManager.getStore(shop);
    
    if (!store) {
      console.log('❌ No active store found for:', shop);
      return res.status(401).json({ error: 'No active store found for this shop' });
    }

    console.log('✅ Store found:', store.shop);

    // Get the session for this shop
    const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
    
    console.log('📋 Sessions found:', sessions?.length || 0);
    
    if (!sessions || sessions.length === 0) {
      console.log('❌ No valid session found for:', shop);
      return res.status(401).json({ error: 'No valid session found for this shop' });
    }

    const session = sessions[0];
    console.log('✅ Using session:', session.id);

    // Add both session and store data to the request
    req.session = session;
    req.store = store;
    res.locals.shopify = { session };
    res.locals.store = store;
    
    console.log('✅ Session validation successful for:', shop);
    next();
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
