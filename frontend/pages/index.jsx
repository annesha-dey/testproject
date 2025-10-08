import { useState, useEffect } from "react";
import {
  Card,
  Page,
  Layout,
  TextField,
  Button,
  Text,
  Stack,
  Image,
  Badge,
  DisplayText,
  Heading,
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
  const [shopDomain, setShopDomain] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentShop, setCurrentShop] = useState("");

  useEffect(() => {
    // Check if we have shop parameter in URL (after OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
    
    if (shop) {
      setIsAuthenticated(true);
      setCurrentShop(shop);
    }
  }, []);

  const handleInstall = () => {
    if (!shopDomain) return;
    
    // Ensure shop domain has .myshopify.com
    const fullShopDomain = shopDomain.includes('.myshopify.com') 
      ? shopDomain 
      : `${shopDomain}.myshopify.com`;
    
    // Redirect to backend OAuth initiation
    const backendUrl = "https://277949e9b10a.ngrok-free.app";
    window.location.href = `${backendUrl}/api/auth?shop=${fullShopDomain}`;
  };

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
          <Layout.Section>
            <Banner
              title="Welcome to Ring a Roses App!"
              status="success"
              onDismiss={() => {}}
            >
              <p>Your app is successfully installed and ready to use. Start exploring the features below.</p>
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
                      <Heading>📊 Analytics</Heading>
                    </Stack>
                    <DisplayText size="medium">1,247</DisplayText>
                    <Text variant="bodyMd" tone="subdued">
                      Total processed items
                    </Text>
                    <Text variant="bodySm" tone="success">
                      ↗ +12% from last month
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
                    <DisplayText size="medium">156</DisplayText>
                    <Text variant="bodyMd" tone="subdued">
                      Products managed
                    </Text>
                    <Button fullWidth>
                      View Products
                    </Button>
                  </Stack>
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

  return (
    <Page title="Install Ring a Roses App">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Image
                source={trophyImage}
                alt="Ring a Roses App"
                width={120}
              />
              <DisplayText size="large">Ring a Roses App</DisplayText>
              <Text variant="bodyLg" alignment="center" tone="subdued">
                Enter your shop domain to get started
              </Text>
              
              <div style={{ width: '100%', maxWidth: '400px' }}>
                <Stack vertical spacing="tight">
                  <TextField
                    label="Shop Domain"
                    value={shopDomain}
                    onChange={setShopDomain}
                    placeholder="your-shop-name"
                    suffix=".myshopify.com"
                    helpText="Enter your shop's domain name"
                  />
                  <Button
                    primary
                    size="large"
                    onClick={handleInstall}
                    disabled={!shopDomain}
                    fullWidth
                  >
                    Install App
                  </Button>
                </Stack>
              </div>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
