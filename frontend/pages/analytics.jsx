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
} from "@shopify/polaris";

export default function AnalyticsPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  return (
    <Page
      title="Analytics"
      subtitle="View your store performance"
      secondaryActions={[
        {
          content: 'Export report',
          onAction: () => console.log('Export report'),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Layout>
            <Layout.Section oneThird>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Heading>📈 Total Sales</Heading>
                  <DisplayText size="medium">$12,847</DisplayText>
                  <Text variant="bodyMd" tone="subdued">
                    This month
                  </Text>
                  <Text variant="bodySm" tone="success">
                    ↗ +18% from last month
                  </Text>
                </Stack>
              </Card>
            </Layout.Section>

            <Layout.Section oneThird>
              <Card sectioned>
                <Stack vertical spacing="tight">
                  <Heading>🛒 Orders</Heading>
                  <DisplayText size="medium">247</DisplayText>
                  <Text variant="bodyMd" tone="subdued">
                    This month
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
                  <Heading>👥 Customers</Heading>
                  <DisplayText size="medium">156</DisplayText>
                  <Text variant="bodyMd" tone="subdued">
                    Total customers
                  </Text>
                  <Text variant="bodySm" tone="success">
                    ↗ +8% from last month
                  </Text>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="tight">
              <Heading>📊 Sales Performance</Heading>
              <Text variant="bodyMd" tone="subdued">
                Monthly progress towards goal
              </Text>
              <ProgressBar progress={68} size="large" />
              <Stack distribution="equalSpacing">
                <Text variant="bodySm">$12,847 of $19,000 goal</Text>
                <Text variant="bodySm">68% complete</Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="tight">
              <Heading>🔥 Top Products</Heading>
              <Stack vertical spacing="tight">
                <Stack distribution="equalSpacing">
                  <Text variant="bodyMd">Classic T-Shirt</Text>
                  <Text variant="bodyMd" fontWeight="bold">45 sold</Text>
                </Stack>
                <Stack distribution="equalSpacing">
                  <Text variant="bodyMd">Denim Jeans</Text>
                  <Text variant="bodyMd" fontWeight="bold">32 sold</Text>
                </Stack>
                <Stack distribution="equalSpacing">
                  <Text variant="bodyMd">Running Shoes</Text>
                  <Text variant="bodyMd" fontWeight="bold">28 sold</Text>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
