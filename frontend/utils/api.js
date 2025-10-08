/**
 * Get the correct API base URL based on the current environment
 */
export const getApiBaseUrl = () => {
  // If we're in development and accessing via localhost, use relative URLs for proxy
  if (window.location.hostname === 'localhost') {
    return '';
  }
  
  // If we're accessing via ngrok or production, use the backend URL directly
  return 'https://277949e9b10a.ngrok-free.app';
};

/**
 * Make an API request with the correct base URL
 */
export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  return response;
};
