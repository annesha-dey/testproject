import BillingManager from "../utils/billingManager.js";

const billingManager = new BillingManager();

/**
 * Middleware to check if shop has active subscription
 */
export const requireActiveSubscription = async (req, res, next) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(401).json({ 
        error: 'Shop parameter is required',
        requiresSubscription: true 
      });
    }

    const hasActive = await billingManager.hasActiveSubscription(shop);
    
    if (!hasActive) {
      return res.status(402).json({ 
        error: 'Active subscription required',
        requiresSubscription: true,
        billingUrl: `/api/billing/plans`
      });
    }

    next();
  } catch (error) {
    console.error('Billing middleware error:', error);
    return res.status(500).json({ 
      error: 'Billing validation failed',
      requiresSubscription: true 
    });
  }
};

/**
 * Middleware to validate plan limits for specific resources
 */
export const validatePlanLimits = (resource, countField = 'count') => {
  return async (req, res, next) => {
    try {
      const { shop } = req.query;
      const count = req.body[countField] || 1;

      const validation = await billingManager.validatePlanLimits(shop, resource, count);
      
      if (!validation.allowed) {
        return res.status(403).json({
          error: validation.reason,
          limitExceeded: true,
          resource,
          upgradeUrl: `/api/billing/plans`
        });
      }

      next();
    } catch (error) {
      console.error('Plan limits validation error:', error);
      return res.status(500).json({ 
        error: 'Plan validation failed' 
      });
    }
  };
};

/**
 * Middleware to add subscription info to request
 */
export const addSubscriptionInfo = async (req, res, next) => {
  try {
    const { shop } = req.query;
    
    if (shop) {
      const subscription = await billingManager.getCurrentSubscription(shop);
      req.subscription = subscription;
      res.locals.subscription = subscription;
    }

    next();
  } catch (error) {
    console.error('Subscription info middleware error:', error);
    next(); // Continue even if subscription info fails
  }
};

export default {
  requireActiveSubscription,
  validatePlanLimits,
  addSubscriptionInfo
};
