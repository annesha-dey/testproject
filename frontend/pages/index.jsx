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
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";

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
    const backendUrl = "https://61243d5c1409.ngrok-free.app";
    window.location.href = `${backendUrl}/api/auth?shop=${fullShopDomain}`;
  };

  if (isAuthenticated) {
    return (
      <Page narrowWidth>
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <Stack distribution="equalSpacing" alignment="center">
                <Stack.Item fill>
                  <Stack vertical spacing="tight">
                    <Text as="h2" variant="headingLg">
                      Welcome to Ring a Roses App!
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Connected to: {currentShop}
                    </Text>
                    <Text as="p">
                      Your app is now successfully installed and authenticated. 
                      You can start using the app features below.
                    </Text>
                  </Stack>
                </Stack.Item>
                <Stack.Item>
                  <Image
                    source={trophyImage}
                    alt="Success"
                    width={80}
                  />
                </Stack.Item>
              </Stack>
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
    <Page narrowWidth>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose" alignment="center">
              <Image
                source={trophyImage}
                alt="Ring a Roses App"
                width={120}
              />
              <Text as="h1" variant="headingXl" alignment="center">
                Ring a Roses App
              </Text>
              <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
                Enter your shop domain to get started
              </Text>
              
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
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
