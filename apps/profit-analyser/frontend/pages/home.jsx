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
  ButtonGroup,
  Badge,
  Image,
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

import { trophyImage } from "../assets";
import { ProductsCard } from "../components";
import AppLayout from "../components/Layout/AppLayout";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentShop, setCurrentShop] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if we have shop parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
    
    if (!shop) {
      // No shop parameter, redirect to login
      navigate('/login');
      return;
    }
    
    setCurrentShop(shop);
    fetchDashboardData(shop);
  }, [navigate]);

  const fetchDashboardData = async (shop) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 [FRONTEND] Starting fetchDashboardData for shop: ${shop}`);
      console.log(`🔄 [FRONTEND] Current URL:`, window.location.href);
      
      const backendUrl = "https://e43e420e9e45.ngrok-free.app";
      console.log(`🔄 [FRONTEND] Backend URL:`, backendUrl);
      
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
      const testResponse = await fetch(`${backendUrl}/api/profit-analyser/store-data/test?shop=${shop}`, {
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
      const dashboardUrl = `${backendUrl}/api/profit-analyser/analytics/dashboard?shop=${shop}`;
      console.log(`🎯 [FRONTEND] About to call DASHBOARD API:`, dashboardUrl);
      console.log(`🎯 [FRONTEND] Making dashboard request now...`);
      
      const response = await fetch(dashboardUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        credentials: 'include',
      });
      
      console.log(`🎯 [FRONTEND] Dashboard API response status:`, response.status);
      console.log(`🎯 [FRONTEND] Dashboard API response:`, response);

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired or doesn't exist, redirect to login
          console.log(`🔄 Session expired for ${shop}, redirecting to login`);
          navigate('/login');
        }
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Dashboard data received for ${shop}:`, data);
      console.log(`🔍 [FRONTEND] Dashboard data structure:`, JSON.stringify(data, null, 2));
      
      setDashboardData(data);
    } catch (err) {
      console.error(`❌ Error fetching dashboard data:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout>
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
                  <Text variant="bodyLg">Loading dashboard...</Text>
                </Stack>
              </div>
            </Layout.Section>
          </Layout>
        </Page>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Page
        title="Ring a Roses Dashboard"
        subtitle={`Connected to ${currentShop}`}
        primaryAction={{
          content: 'Manage Billing',
          onAction: () => navigate(`/billing?shop=${currentShop}`),
        }}
        secondaryActions={[
          {
            content: 'Settings',
            onAction: () => navigate(`/settings?shop=${currentShop}`),
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
                      onClick={() => navigate('/login')}
                    >
                      Re-authenticate
                    </Button>
                  )}
                </Stack>
              </Banner>
            </Layout.Section>
          )}
          
          <Layout.Section>
            <Banner
              title={dashboardData ? `Welcome to ${currentShop}!` : "Welcome to Ring a Roses App!"}
              status="success"
              onDismiss={() => {}}
            >
              <p>
                {dashboardData 
                  ? `Your app is successfully installed in ${currentShop}. You have ${dashboardData.data?.summary?.totalProducts || 0} products and ${dashboardData.data?.summary?.totalOrders || 0} orders. Start exploring the features below.`
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
                    <Button primary fullWidth onClick={() => navigate(`/billing?shop=${currentShop}`)}>
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
                      {loading ? "..." : (dashboardData?.data?.summary?.totalOrders || 0)}
                    </DisplayText>
                    <Text variant="bodyMd" tone="subdued">
                      Total orders
                    </Text>
                    <Text variant="bodySm" tone="subdued">
                      Total orders in your store
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
                      {loading ? "..." : (dashboardData?.data?.summary?.totalProducts || 0)}
                    </DisplayText>
                    <Text variant="bodyMd" tone="subdued">
                      Products in catalog
                    </Text>
                    <Button fullWidth onClick={() => navigate(`/products?shop=${currentShop}`)}>
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
                      {loading ? "..." : "N/A"}
                    </DisplayText>
                    <Text variant="bodyMd" tone="subdued">
                      Customer data not available
                    </Text>
                    <Button fullWidth onClick={() => navigate(`/customers?shop=${currentShop}`)}>
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
    </AppLayout>
  );
}
