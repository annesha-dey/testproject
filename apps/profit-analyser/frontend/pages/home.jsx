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
  Select,
  DatePicker,
  Popover,
  ActionList,
  Icon,
  Checkbox,
  Filters,
  RangeSlider,
} from "@shopify/polaris";
import { CalendarMajor, FilterMajor } from '@shopify/polaris-icons';
import { useNavigate } from "react-router-dom";

import { trophyImage } from "../assets";
import AppLayout from "../components/Layout/AppLayout";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentShop, setCurrentShop] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [timePeriod, setTimePeriod] = useState('last_30_days');
  const [timeComparison, setTimeComparison] = useState('previous_period');
  const [customStartDate, setCustomStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [colorizeMetrics, setColorizeMetrics] = useState(true);
  const [datePickerActive, setDatePickerActive] = useState(false);
  const [monthGoal, setMonthGoal] = useState(10000); // Default monthly goal

  // Filter options
  const timePeriodOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: 'last_7_days' },
    { label: 'Last 30 days', value: 'last_30_days' },
    { label: 'Last 90 days', value: 'last_90_days' },
    { label: 'This month', value: 'this_month' },
    { label: 'Last month', value: 'last_month' },
    { label: 'This year', value: 'this_year' },
    { label: 'Custom period', value: 'custom' },
  ];

  const timeComparisonOptions = [
    { label: 'Previous period', value: 'previous_period' },
    { label: 'Previous period, day of week', value: 'previous_period_dow' },
    { label: 'Same period, year prior', value: 'same_period_year_prior' },
    { label: 'Year prior, day of week', value: 'year_prior_dow' },
  ];

  // Helper function to get metric color
  const getMetricColor = (value, isPositive = true) => {
    if (!colorizeMetrics) return 'subdued';
    if (value > 0) return isPositive ? 'success' : 'critical';
    if (value < 0) return isPositive ? 'critical' : 'success';
    return 'subdued';
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Helper function to calculate percentage
  const calculatePercentage = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

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
        title="📊 Dashboard"
        subtitle={`Store: ${currentShop}`}
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

          {/* Filters Section */}
          <Layout.Section>
            <Card sectioned>
              <Stack vertical spacing="loose">
                <Heading>Dashboard Filters</Heading>
                
                <Stack distribution="fillEvenly" spacing="loose">
                  {/* Time Period Filter */}
                  <Stack.Item fill>
                    <Select
                      label="Time period"
                      options={timePeriodOptions}
                      value={timePeriod}
                      onChange={setTimePeriod}
                    />
                  </Stack.Item>

                  {/* Time Comparison Filter */}
                  <Stack.Item fill>
                    <Select
                      label="Time comparison"
                      options={timeComparisonOptions}
                      value={timeComparison}
                      onChange={setTimeComparison}
                    />
                  </Stack.Item>

                  {/* Colorize Metrics Toggle */}
                  <Stack.Item>
                    <Checkbox
                      label="Colorize metrics"
                      checked={colorizeMetrics}
                      onChange={setColorizeMetrics}
                    />
                  </Stack.Item>
                </Stack>

                {/* Custom Date Range */}
                {timePeriod === 'custom' && (
                  <Stack distribution="fillEvenly" spacing="loose">
                    <Stack.Item fill>
                      <Popover
                        active={datePickerActive}
                        activator={
                          <Button
                            onClick={() => setDatePickerActive(!datePickerActive)}
                            icon={CalendarMajor}
                          >
                            {customStartDate.toLocaleDateString()} - {customEndDate.toLocaleDateString()}
                          </Button>
                        }
                        onClose={() => setDatePickerActive(false)}
                      >
                        <Card sectioned>
                          <Stack vertical>
                            <Text variant="headingMd">Select Date Range</Text>
                            <DatePicker
                              month={customStartDate.getMonth()}
                              year={customStartDate.getFullYear()}
                              selected={{
                                start: customStartDate,
                                end: customEndDate,
                              }}
                              onMonthChange={(month, year) => {
                                setCustomStartDate(new Date(year, month, 1));
                              }}
                              onChange={({ start, end }) => {
                                setCustomStartDate(start);
                                setCustomEndDate(end || start);
                              }}
                              allowRange
                            />
                          </Stack>
                        </Card>
                      </Popover>
                    </Stack.Item>
                  </Stack>
                )}
              </Stack>
            </Card>
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
                    <Text variant="bodyMd" tone={getMetricColor(5.2)}>
                      +5.2% vs previous period
                    </Text>
                    <Button fullWidth onClick={() => navigate(`/orders?shop=${currentShop}`)}>
                      View Orders
                    </Button>
                  </Stack>
                </Card>
              </Layout.Section>

              <Layout.Section oneThird>
                <Card sectioned>
                  <Stack vertical spacing="tight">
                    <Stack alignment="center">
                      <Heading>💰 Total Sales</Heading>
                    </Stack>
                    <DisplayText size="medium">
                      {loading ? "..." : formatCurrency(dashboardData?.data?.summary?.totalRevenue || 0)}
                    </DisplayText>
                    <Text variant="bodyMd" tone={getMetricColor(12.8)}>
                      +12.8% vs previous period
                    </Text>
                    <Button fullWidth onClick={() => navigate(`/analytics?shop=${currentShop}`)}>
                      View Analytics
                    </Button>
                  </Stack>
                </Card>
              </Layout.Section>
            </Layout>
          </Layout.Section>

          <Layout.Section>
            <Layout>
              <Layout.Section oneThird>
                <Card sectioned>
                  <Stack vertical spacing="tight">
                    <Stack alignment="center">
                      <Heading>📈 Net Sales</Heading>
                    </Stack>
                    <DisplayText size="medium">
                      {loading ? "..." : formatCurrency((dashboardData?.data?.summary?.totalRevenue || 0) * 0.85)}
                    </DisplayText>
                    <Text variant="bodyMd" tone={getMetricColor(8.4)}>
                      +8.4% vs previous period
                    </Text>
                    <Button fullWidth onClick={() => navigate(`/reports?shop=${currentShop}`)}>
                      View Reports
                    </Button>
                  </Stack>
                </Card>
              </Layout.Section>

              <Layout.Section oneThird>
                <Card sectioned>
                  <Stack vertical spacing="tight">
                    <Stack alignment="center">
                      <Heading>🛒 AOV</Heading>
                    </Stack>
                    <DisplayText size="medium">
                      {loading ? "..." : formatCurrency(dashboardData?.data?.summary?.averageOrderValue || 0)}
                    </DisplayText>
                    <Text variant="bodyMd" tone={getMetricColor(3.1)}>
                      +3.1% vs previous period
                    </Text>
                    <Button fullWidth onClick={() => navigate(`/customers?shop=${currentShop}`)}>
                      View Customers
                    </Button>
                  </Stack>
                </Card>
              </Layout.Section>

              <Layout.Section oneThird>
                <Card sectioned>
                  <Stack vertical spacing="tight">
                    <Stack alignment="center">
                      <Heading>📦 Avg Units/Order</Heading>
                    </Stack>
                    <DisplayText size="medium">
                      {loading ? "..." : (2.4).toFixed(1)}
                    </DisplayText>
                    <Text variant="bodyMd" tone={getMetricColor(-1.2, false)}>
                      -1.2% vs previous period
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
                      <Heading>↩️ Refunds</Heading>
                    </Stack>
                    <DisplayText size="medium">
                      {loading ? "..." : formatCurrency(dashboardData?.data?.summary?.totalRefunds || 0)}
                    </DisplayText>
                    <Text variant="bodyMd" tone={getMetricColor(-15.3, false)}>
                      -15.3% vs previous period
                    </Text>
                    <Button fullWidth onClick={() => navigate(`/orders?shop=${currentShop}`)}>
                      View Refunds
                    </Button>
                  </Stack>
                </Card>
              </Layout.Section>

              <Layout.Section oneHalf>
                <Card sectioned>
                  <Stack vertical spacing="loose">
                    <Stack distribution="equalSpacing" alignment="center">
                      <Heading>🎯 Monthly Sales Goal</Heading>
                      <Text variant="bodyMd" tone="subdued">
                        Goal: {formatCurrency(monthGoal)}
                      </Text>
                    </Stack>
                    
                    <ProgressBar 
                      progress={Math.min(((dashboardData?.data?.summary?.totalRevenue || 0) / monthGoal) * 100, 100)}
                      size="large"
                    />
                    
                    <Stack distribution="equalSpacing">
                      <Text variant="bodyMd">
                        Current: {formatCurrency(dashboardData?.data?.summary?.totalRevenue || 0)}
                      </Text>
                      <Text variant="bodyMd">
                        Remaining: {formatCurrency(Math.max(monthGoal - (dashboardData?.data?.summary?.totalRevenue || 0), 0))}
                      </Text>
                    </Stack>
                  </Stack>
                </Card>
              </Layout.Section>
            </Layout>
          </Layout.Section>



        </Layout>
      </Page>
    </AppLayout>
  );
}
