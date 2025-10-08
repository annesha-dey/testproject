import { useTranslation } from "react-i18next";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useEffect } from "react";
import {
  Card,
  Page,
  Layout,
  TextContainer,
  Heading,
  Banner,
  List,
  Link,
  Text,
  Button,
  TextField,
  FormLayout,
  Stack,
  Spinner,
  DisplayText,
  CalloutCard,
  ResourceList,
  ResourceItem,
  Avatar,
  Thumbnail,
  ProgressBar,
  Banner,
  Link,
  ButtonGroup,
} from "@shopify/polaris";
import LoginPage from "../components/Auth/LoginPage";
import { useTranslation } from "react-i18next";
// Temporarily remove problematic icons
// import { 
//   CreditCardMinor, 
//   AnalyticsMinor, 
//   ProductsMinor 
// } from "@shopify/polaris-icons";

import { trophyImage } from "../assets";
import { ProductsCard } from "../components";

export default function HomePage() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentShop, setCurrentShop] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if we have shop parameter in URL (after OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
    
    if (shop) {
      setIsAuthenticated(true);
      setCurrentShop(shop);
      fetchDashboardData(shop);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = async (shop) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching dashboard data for shop: ${shop}`);
      
      const backendUrl = "https://277949e9b10a.ngrok-free.app";
      
      // First test if backend server is running
      console.log(`🏥 Testing backend server health...`);
      try {
        const healthResponse = await fetch(`${backendUrl}/api/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log(`✅ Backend server is running:`, healthData);
        } else {
          console.log(`❌ Backend health check failed:`, healthResponse.status);
          throw new Error(`Backend server not responding (${healthResponse.status})`);
        }
      } catch (healthError) {
        console.error(`❌ Cannot connect to backend server:`, healthError);
        throw new Error(`Backend server is not running or not accessible: ${healthError.message}`);
      }

      // Now try the store data test endpoint
      console.log(`🧪 Testing store data routes...`);
      const testResponse = await fetch(`${backendUrl}/api/store-data/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log(`✅ Store data routes working:`, testData);
      } else {
        console.log(`❌ Store data routes test failed:`, testResponse.status);
        throw new Error(`Store data routes not working (${testResponse.status})`);
      }
      
      // Now try the dashboard endpoint
      const response = await fetch(`${backendUrl}/api/store-data/dashboard/${shop}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired or doesn't exist, show authentication message
          console.log(`🔄 Session expired for ${shop}, authentication required`);
          setError(`Authentication required for ${shop}. Please reinstall the app.`);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Dashboard data received for ${shop}:`, data);
      
      setDashboardData(data);
    } catch (err) {
      console.error(`❌ Error fetching dashboard data:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  // Show login page if no shop parameter
  if (!isAuthenticated && !loading) {
    return <LoginPage />;
  }

  if (isAuthenticated) {
    return (
      <Page
        title="Ring a Roses Dashboard"
        subtitle={`Connected to ${currentShop}`}
        primaryAction={{
          content: 'Manage Billing',
          onAction: () => window.location.href = `/billing?shop=${currentShop}`,
        }}
        secondaryActions={[
          {
            content: 'Settings',
            onAction: () => window.location.href = `/?shop=${currentShop}&view=settings`,
          },
          {
            content: 'Help',
            onAction: () => window.open('https://help.shopify.com', '_blank'),
          },
        ]}
      >
        <Layout>
          {error && (
            <Layout.Section>
              <Banner
                title="Error Loading Store Data"
                status="critical"
                onDismiss={() => setError(null)}
              >
                <p>{error}</p>
                <Stack>
                  <Button onClick={() => fetchDashboardData(currentShop)}>
                    Retry
                  </Button>
                  {error.includes('Authentication required') && (
                    <Button 
                      primary 
                      onClick={() => {
                        const backendUrl = "https://277949e9b10a.ngrok-free.app";
                        console.log(`🔄 Redirecting to OAuth for shop: ${currentShop}`);
                        window.location.href = `${backendUrl}/api/auth?shop=${currentShop}`;
                      }}
                    >
                      Reinstall App
                    </Button>
                  )}
                </Stack>
              </Banner>
            </Layout.Section>
          )}
          
          <Layout.Section>
            <Banner
              title={dashboardData ? `Welcome to ${dashboardData.store.name}!` : "Welcome to Ring a Roses App!"}
              status="success"
              onDismiss={() => {}}
            >
              <p>
                {dashboardData 
                  ? `Your app is successfully installed in ${dashboardData.store.name} (${dashboardData.store.domain}). Start exploring the features below.`
                  : "Your app is successfully installed and ready to use. Start exploring the features below."
                }
              </p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <Layout>
              <Layout.Section oneThird>
                <Card sectioned>
                  <Stack vertical spacing="tight">
                    <Stack alignment="center">
                      <Heading>💳 Billing Status</Heading>
                    </Stack>
                    <Text variant="bodyMd" tone="subdued">
                      Current Plan: Free Trial
                    </Text>
                    <ProgressBar progress={75} size="small" />
                    <Text variant="bodySm" tone="subdued">
                      7 days remaining
                    </Text>
                    <Button primary fullWidth onClick={() => window.location.href = `/billing?shop=${currentShop}`}>
                      Upgrade Plan
                    </Button>
                  </Stack>
                </Card>
              </Layout.Section>

              <Layout.Section oneThird>
                <Card sectioned>
                  <Stack vertical spacing="tight">
                    <Stack alignment="center">
                      <Heading>📋 Orders</Heading>
                    </Stack>
                    <DisplayText size="medium">
                      {loading ? "..." : (dashboardData?.metrics.orders || 0)}
                    </DisplayText>
                    <Text variant="bodyMd" tone="subdued">
                      Total orders
                    </Text>
                    <Text variant="bodySm" tone={dashboardData?.permissions?.hasOrdersAccess ? "subdued" : "warning"}>
                      {dashboardData?.permissions?.hasOrdersAccess 
                        ? `${dashboardData?.store.currency || 'USD'} currency`
                        : 'Orders access not available'
                      }
                    </Text>
                  </Stack>
                </Card>
              </Layout.Section>

              <Layout.Section oneThird>
                <Card sectioned>
                  <Stack vertical spacing="tight">
                    <Stack alignment="center">
                      <Heading>📦 Products</Heading>
                    </Stack>
                    <DisplayText size="medium">
                      {loading ? "..." : (dashboardData?.metrics.products || 0)}
                    </DisplayText>
                    <Text variant="bodyMd" tone="subdued">
                      Products in catalog
                    </Text>
                    <Button fullWidth onClick={() => window.location.href = `/products?shop=${currentShop}`}>
                      View Products
                    </Button>
                  </Stack>
                </Card>
              </Layout.Section>
            </Layout>
          </Layout.Section>

          <Layout.Section>
            <Layout>
              <Layout.Section oneHalf>
                <Card sectioned>
                  <Stack vertical spacing="tight">
                    <Stack alignment="center">
                      <Heading>👥 Customers</Heading>
                    </Stack>
                    <DisplayText size="medium">
                      {loading ? "..." : (dashboardData?.metrics.customers || 0)}
                    </DisplayText>
                    <Text variant="bodyMd" tone={dashboardData?.permissions?.hasCustomersAccess ? "subdued" : "warning"}>
                      {dashboardData?.permissions?.hasCustomersAccess 
                        ? 'Total customers'
                        : 'Customers access not available'
                      }
                    </Text>
                    <Button fullWidth onClick={() => window.location.href = `/customers?shop=${currentShop}`}>
                      View Customers
                    </Button>
                  </Stack>
                </Card>
              </Layout.Section>

              <Layout.Section oneHalf>
                <Card>
                  <Card.Header>
                    <Heading>🕒 Recent Orders</Heading>
                  </Card.Header>
                  {loading ? (
                    <Card.Section>
                      <Text>Loading recent orders...</Text>
                    </Card.Section>
                  ) : dashboardData?.recentOrders?.length > 0 ? (
                    <ResourceList
                      resourceName={{singular: 'order', plural: 'orders'}}
                      items={dashboardData.recentOrders.slice(0, 5)}
                      renderItem={(order) => (
                        <ResourceItem
                          id={order.id}
                          accessibilityLabel={`View order ${order.name}`}
                        >
                          <Stack alignment="center">
                            <Stack.Item fill>
                              <Stack vertical spacing="extraTight">
                                <Text variant="bodyMd" fontWeight="bold">
                                  {order.name}
                                </Text>
                                <Text variant="bodySm" tone="subdued">
                                  {order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Guest'}
                                </Text>
                              </Stack>
                            </Stack.Item>
                            <Stack vertical alignment="trailing">
                              <Text variant="bodyMd" fontWeight="bold">
                                {order.currency} {order.total_price}
                              </Text>
                              <Badge status={order.financial_status === 'paid' ? 'success' : 'warning'}>
                                {order.financial_status}
                              </Badge>
                            </Stack>
                          </Stack>
                        </ResourceItem>
                      )}
                    />
                  ) : (
                    <Card.Section>
                      <Text>No recent orders found</Text>
                    </Card.Section>
                  )}
                </Card>
              </Layout.Section>
            </Layout>
          </Layout.Section>

          <Layout.Section>
            <CalloutCard
              title="Get started with Ring a Roses"
              illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa6.svg"
              primaryAction={{
                content: 'Set up billing',
                url: `/billing?shop=${currentShop}`,
              }}
            >
              <p>Set up your billing plan to unlock all features and start managing your products efficiently.</p>
            </CalloutCard>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <ResourceList
                resourceName={{singular: 'activity', plural: 'activities'}}
                items={[
                  {
                    id: '1',
                    name: 'App installed successfully',
                    time: '2 minutes ago',
                    status: 'success',
                  },
                  {
                    id: '2', 
                    name: 'Connected to store',
                    time: '5 minutes ago',
                    status: 'success',
                  },
                  {
                    id: '3',
                    name: 'Authentication completed',
                    time: '5 minutes ago', 
                    status: 'success',
                  },
                ]}
                renderItem={(item) => {
                  const {id, name, time, status} = item;
                  return (
                    <ResourceItem
                      id={id}
                      accessibilityLabel={`View details for ${name}`}
                    >
                      <Stack alignment="center">
                        <Badge status={status}>{status}</Badge>
                        <Stack.Item fill>
                          <Text variant="bodyMd" fontWeight="bold">
                            {name}
                          </Text>
                        </Stack.Item>
                        <Text variant="bodySm" tone="subdued">
                          {time}
                        </Text>
                      </Stack>
                    </ResourceItem>
                  );
                }}
              />
            </Card>
          </Layout.Section>

          <Layout.Section>
            <ProductsCard />
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Loading state
  return (
    <Page>
      <Layout>
        <Layout.Section>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '50vh' 
          }}>
            <Stack vertical alignment="center" spacing="loose">
              <Spinner size="large" />
              <Text variant="bodyLg">Loading...</Text>
            </Stack>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
