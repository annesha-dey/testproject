import shopify from "../config/shopify.js";

/**
 * Middleware to validate authenticated session for API routes
 * For non-embedded apps, we need to handle session validation differently
 */
export const validateSession = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    
    if (!shop) {
      return res.status(401).json({ error: 'Shop parameter is required' });
    }

    // Get the session for this shop
    const session = await shopify.config.sessionStorage.findSessionsByShop(shop);
    
    if (!session || session.length === 0) {
      return res.status(401).json({ error: 'No valid session found for this shop' });
    }

    // Add the session to the request for use in API handlers
    req.session = session[0];
    res.locals.shopify = { session: session[0] };
    
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
