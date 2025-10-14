import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { checkAuthStatus, getShopFromUrl, redirectToLogin } from '../../utils/auth';
import { Page, Card, Spinner, Text, Banner } from '@shopify/polaris';

/**
 * AuthGuard component that protects routes requiring authentication
 * Checks session status and redirects to login if not authenticated
 */
const AuthGuard = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true/false = result
  const [error, setError] = useState('');
  const location = useLocation();
  const shop = getShopFromUrl();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!shop) {
          console.log('No shop parameter found, redirecting to login');
          redirectToLogin();
          return;
        }

        console.log(`Checking authentication for shop: ${shop}`);
        const authResult = await checkAuthStatus(shop);
        
        if (authResult.authenticated) {
          console.log('Authentication successful');
          setIsAuthenticated(true);
        } else {
          console.log('Authentication failed:', authResult.error);
          setError(authResult.error || 'Authentication required');
          
          // Redirect to login after a short delay to show the error
          setTimeout(() => {
            redirectToLogin();
          }, 2000);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setError('Failed to verify authentication');
        setTimeout(() => {
          redirectToLogin();
        }, 2000);
      }
    };

    checkAuth();
  }, [shop, location.pathname]);

  // Show loading spinner while checking authentication
  if (isAuthenticated === null) {
    return (
      <Page>
        <Card>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '2rem',
            gap: '1rem'
          }}>
            <Spinner size="large" />
            <Text variant="bodyMd">Verifying authentication...</Text>
            {shop && (
              <Text variant="bodySm" tone="subdued">
                Checking access for {shop}
              </Text>
            )}
          </div>
        </Card>
      </Page>
    );
  }

  // Show error message if authentication failed
  if (isAuthenticated === false) {
    return (
      <Page>
        <Card>
          <div style={{ padding: '2rem' }}>
            <Banner
              title="Authentication Required"
              status="critical"
            >
              <Text>{error}</Text>
              <Text variant="bodySm" tone="subdued">
                Redirecting to login page...
              </Text>
            </Banner>
          </div>
        </Card>
      </Page>
    );
  }

  // Render protected content if authenticated
  return children;
};

export default AuthGuard;
