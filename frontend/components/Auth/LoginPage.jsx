import React, { useState } from 'react';
import {
  Page,
  Card,
  FormLayout,
  TextField,
  Button,
  Stack,
  Heading,
  Text,
  Link,
  Banner,
  Spinner,
  Layout,
  Box,
  Divider
} from '@shopify/polaris';
import './LoginPage.css';

export default function LoginPage() {
  const [shopDomain, setShopDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!shopDomain.trim()) {
      setError('Please enter your Shopify store URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Clean and validate shop domain
      let cleanDomain = shopDomain.trim().toLowerCase();
      
      // Remove protocol if present
      cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
      
      // Remove trailing slash
      cleanDomain = cleanDomain.replace(/\/$/, '');
      
      // Add .myshopify.com if not present
      if (!cleanDomain.includes('.myshopify.com')) {
        // Remove .myshopify.com if partially typed
        cleanDomain = cleanDomain.replace(/\.myshopify.*$/, '');
        cleanDomain = `${cleanDomain}.myshopify.com`;
      }

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.myshopify\.com$/;
      if (!domainRegex.test(cleanDomain)) {
        throw new Error('Please enter a valid Shopify store URL (e.g., your-store.myshopify.com)');
      }

      console.log(`🔄 Initiating login for shop: ${cleanDomain}`);

      // Redirect to backend OAuth initiation
      const backendUrl = "https://e43e420e9e45.ngrok-free.app";
      window.location.href = `${backendUrl}/api/auth?shop=${cleanDomain}`;

    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">🌹</div>
          <h1 className="login-title">Log in to RingaRoses</h1>
          <p className="login-subtitle">Use your Shopify store URL to log in.</p>
        </div>

        {/* Form */}
        <div className="login-form">
          <FormLayout>
            {error && (
              <Banner status="critical" onDismiss={() => setError('')}>
                {error}
              </Banner>
            )}

            <TextField
              label="Shopify Store URL"
              value={shopDomain}
              onChange={setShopDomain}
              onKeyPress={handleKeyPress}
              placeholder="your-store.myshopify.com"
              helpText="Enter your store's .myshopify.com URL"
              disabled={isLoading}
              autoComplete="off"
              autoFocus
            />

            <Button
              primary
              fullWidth
              size="large"
              onClick={handleLogin}
              loading={isLoading}
              disabled={!shopDomain.trim() || isLoading}
            >
              {isLoading ? 'Connecting to your store...' : 'Log in'}
            </Button>
          </FormLayout>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <Text variant="bodyMd" tone="subdued">
            Not a customer?{' '}
            <Link url="https://apps.shopify.com" external>
              Get started for free via the Shopify App Store
            </Link>
          </Text>
          
          <div className="feature-list">
            <div className="feature-item">
              <span>🔒</span>
              <span>Secure OAuth</span>
            </div>
            <div className="feature-item">
              <span>⚡</span>
              <span>Multi-store support</span>
            </div>
            <div className="feature-item">
              <span>📊</span>
              <span>Real-time analytics</span>
            </div>
          </div>
          
          <Box paddingBlockStart="4">
            <Text variant="bodySm" tone="subdued">
              Powered by RingaRoses Analytics Platform
            </Text>
          </Box>
        </div>
      </div>
    </div>
  );
}
