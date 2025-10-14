import { apiRequest } from './api';

/**
 * Check if the current session is authenticated
 * @param {string} shop - The shop domain
 * @returns {Promise<{authenticated: boolean, error?: string}>}
 */
export const checkAuthStatus = async (shop) => {
  try {
    if (!shop) {
      return { authenticated: false, error: 'Shop parameter required' };
    }

    const response = await apiRequest(`/api/auth/session-status?shop=${shop}`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Auth status check failed:', error);
    return { 
      authenticated: false, 
      error: 'Failed to check authentication status' 
    };
  }
};

/**
 * Logout the current user
 * @param {string} shop - The shop domain
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const logout = async (shop) => {
  try {
    if (!shop) {
      return { success: false, error: 'Shop parameter required' };
    }

    const response = await apiRequest(`/api/auth/logout?shop=${shop}`, {
      method: 'POST'
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Logout failed:', error);
    return { 
      success: false, 
      error: 'Logout request failed' 
    };
  }
};

/**
 * Redirect to login page
 */
export const redirectToLogin = () => {
  window.location.href = '/login';
};

/**
 * Get shop parameter from URL
 * @returns {string|null} Shop domain or null if not found
 */
export const getShopFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('shop');
};

/**
 * Validate shop domain format
 * @param {string} shop - Shop domain to validate
 * @returns {boolean} True if valid shop domain
 */
export const isValidShopDomain = (shop) => {
  if (!shop) return false;
  
  // Basic validation for .myshopify.com domains
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.myshopify\.com$/;
  return shopRegex.test(shop);
};
