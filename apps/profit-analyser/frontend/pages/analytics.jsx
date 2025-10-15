import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Page,
  Layout,
  Text,
  DisplayText,
  Stack,
  ProgressBar,
  Heading,
  Spinner,
  Badge,
  ResourceList,
  ResourceItem,
  Avatar,
} from "@shopify/polaris";
import AppLayout from "../components/Layout/AppLayout";

export default function AnalyticsPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        console.log("🔄 Fetching analytics data for shop:", shop);
        
        // Use relative URLs to ensure same domain
        console.log("🔍 Current URL:", window.location.href);
        console.log("🔍 Origin:", window.location.origin);
        console.log("🔍 Host:", window.location.host);
        console.log("🔍 Protocol:", window.location.protocol);
        
        // Use same pattern as Orders and Products pages
        const backendUrl = "https://e43e420e9e45.ngrok-free.app";
        
        console.log("🔄 Fetching dashboard data...");
        const dashboardUrl = `${backendUrl}/api/profit-analyser/analytics/dashboard?shop=${shop}`;
        console.log("🔄 Dashboard URL:", dashboardUrl);
        
        const response = await fetch(dashboardUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          credentials: 'include',
        });
        
        console.log("🔍 Dashboard response status:", response.status);
        console.log("🔍 Dashboard response URL:", response.url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Dashboard response error:", errorText.substring(0, 500));
          throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 200)}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log("🔍 Content-Type:", contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error("❌ Non-JSON response:", text.substring(0, 200));
          throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}...`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          console.log("✅ Analytics data fetched:", data.data);
          setAnalyticsData(data.data);
        } else {
          console.error("❌ Analytics API error:", data.error);
          setError(data.error);
        }
      } catch (err) {
        console.error("❌ Error fetching analytics data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (shop) {
      fetchAnalyticsData();
    }
  }, [shop]);

  if (loading) {
    return (
      <AppLayout>
        <Page title="Analytics">
          <Layout>
            <Layout.Section>
              <Card sectioned>
                <Stack alignment="center">
                  <Spinner size="large" />
                  <Text variant="bodyMd">Loading analytics data...</Text>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Page title="Analytics">
          <Layout>
            <Layout.Section>
              <Card sectioned>
                <Stack vertical>
                  <Text variant="headingMd" tone="critical">Error loading analytics</Text>
                  <Text variant="bodyMd">{error}</Text>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </AppLayout>
    );
  }

  const { summary, trends, recentOrders, topProducts, performance } = analyticsData || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    const num = parseFloat(value) || 0;
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getTrendColor = (value) => {
    const num = parseFloat(value) || 0;
    return num >= 0 ? 'success' : 'critical';
  };

  return (
    <AppLayout>
      <Page
        title="Analytics"
        subtitle="Real-time profit analytics from your store data"
        secondaryActions={[
          {
            content: 'Export report',
            onAction: () => console.log('Export report'),
          },
        ]}
      >
      <Layout>
        {/* Key Metrics Row */}
        <Layout.Section>
          <Layout>
            <Layout.Section oneThird>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Heading>💰 Total Revenue</Heading>
                  <DisplayText size="medium">{formatCurrency(summary?.totalRevenue)}</DisplayText>
                  <Text variant="bodyMd" tone="subdued">
                    All time
                  </Text>
                  <Badge tone={getTrendColor(trends?.revenueGrowth)}>
                    {formatPercentage(trends?.revenueGrowth)} vs last 30 days
                  </Badge>
                </Stack>
              </Card>
            </Layout.Section>

            <Layout.Section oneThird>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Heading>📈 Total Profit</Heading>
                  <DisplayText size="medium">{formatCurrency(summary?.totalProfit)}</DisplayText>
                  <Text variant="bodyMd" tone="subdued">
                    Margin: {summary?.profitMargin}%
                  </Text>
                  <Badge tone={getTrendColor(trends?.profitGrowth)}>
                    {formatPercentage(trends?.profitGrowth)} vs last 30 days
                  </Badge>
                </Stack>
              </Card>
            </Layout.Section>

            <Layout.Section oneThird>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Heading>🛒 Orders</Heading>
                  <DisplayText size="medium">{summary?.totalOrders || 0}</DisplayText>
                  <Text variant="bodyMd" tone="subdued">
                    AOV: {formatCurrency(summary?.averageOrderValue)}
                  </Text>
                  <Badge tone={getTrendColor(trends?.orderGrowth)}>
                    {formatPercentage(trends?.orderGrowth)} vs last 30 days
                  </Badge>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        {/* Performance Metrics Row */}
        <Layout.Section>
          <Layout>
            <Layout.Section oneHalf>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Heading>📊 Performance Metrics</Heading>
                  <Stack vertical spacing="tight">
                    <Stack distribution="equalSpacing">
                      <Text variant="bodyMd">Products</Text>
                      <Text variant="bodyMd" fontWeight="bold">{summary?.totalProducts || 0}</Text>
                    </Stack>
                    <Stack distribution="equalSpacing">
                      <Text variant="bodyMd">Customers</Text>
                      <Text variant="bodyMd" fontWeight="bold">{summary?.totalCustomers || 0}</Text>
                    </Stack>
                    <Stack distribution="equalSpacing">
                      <Text variant="bodyMd">Avg Profit/Order</Text>
                      <Text variant="bodyMd" fontWeight="bold">{formatCurrency(performance?.averageProfitPerOrder)}</Text>
                    </Stack>
                    <Stack distribution="equalSpacing">
                      <Text variant="bodyMd">Revenue/Customer</Text>
                      <Text variant="bodyMd" fontWeight="bold">{formatCurrency(performance?.conversionMetrics?.revenuePerCustomer)}</Text>
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
            </Layout.Section>

            <Layout.Section oneHalf>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Heading>🎯 Profit Goal Progress</Heading>
                  <Text variant="bodyMd" tone="subdued">
                    Current profit margin: {summary?.profitMargin}%
                  </Text>
                  <ProgressBar 
                    progress={Math.min((summary?.profitMargin || 0), 100)} 
                    size="large" 
                  />
                  <Stack distribution="equalSpacing">
                    <Text variant="bodySm">{formatCurrency(summary?.totalProfit)} profit earned</Text>
                    <Text variant="bodySm">{summary?.profitMargin}% margin</Text>
                  </Stack>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        {/* Top Products */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="tight">
              <Heading>🔥 Top Performing Products</Heading>
              {topProducts && topProducts.length > 0 ? (
                <ResourceList
                  items={topProducts}
                  renderItem={(product) => (
                    <ResourceItem
                      id={product.id}
                      media={<Avatar size="medium" name={product.title} />}
                    >
                      <Stack distribution="equalSpacing">
                        <Stack vertical spacing="extraTight">
                          <Text variant="bodyMd" fontWeight="bold">{product.title}</Text>
                          <Text variant="bodySm" tone="subdued">
                            {product.totalQuantity} sold • {product.profitMargin}% margin
                          </Text>
                        </Stack>
                        <Stack vertical spacing="extraTight" alignment="trailing">
                          <Text variant="bodyMd" fontWeight="bold">{formatCurrency(product.totalProfit)}</Text>
                          <Text variant="bodySm" tone="subdued">{formatCurrency(product.totalRevenue)} revenue</Text>
                        </Stack>
                      </Stack>
                    </ResourceItem>
                  )}
                />
              ) : (
                <Text variant="bodyMd" tone="subdued">No product data available yet.</Text>
              )}
            </Stack>
          </Card>
        </Layout.Section>

        {/* Recent Orders */}
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="tight">
              <Heading>📋 Recent Orders</Heading>
              {recentOrders && recentOrders.length > 0 ? (
                <ResourceList
                  items={recentOrders}
                  renderItem={(order) => (
                    <ResourceItem
                      id={order.id}
                      media={<Avatar size="medium" name={order.name} />}
                    >
                      <Stack distribution="equalSpacing">
                        <Stack vertical spacing="extraTight">
                          <Text variant="bodyMd" fontWeight="bold">{order.name}</Text>
                          <Text variant="bodySm" tone="subdued">
                            {new Date(order.date).toLocaleDateString()} • {order.status}
                          </Text>
                        </Stack>
                        <Stack vertical spacing="extraTight" alignment="trailing">
                          <Text variant="bodyMd" fontWeight="bold">{formatCurrency(order.total)}</Text>
                          <Text variant="bodySm" tone="success">
                            +{formatCurrency(order.profit)} profit ({order.profitMargin}%)
                          </Text>
                        </Stack>
                      </Stack>
                    </ResourceItem>
                  )}
                />
              ) : (
                <Text variant="bodyMd" tone="subdued">No recent orders available.</Text>
              )}
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
    </AppLayout>
  );
}
