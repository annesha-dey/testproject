import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Page,
  Layout,
  Text,
  Badge,
  ResourceList,
  ResourceItem,
  Avatar,
  Stack,
  Button,
  EmptyState,
} from "@shopify/polaris";
import AppLayout from "../components/Layout/AppLayout";

export default function OrdersPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  const orders = [
    {
      id: '1001',
      customer: 'John Doe',
      total: '$125.00',
      status: 'fulfilled',
      date: 'Oct 8, 2024',
    },
    {
      id: '1002',
      customer: 'Jane Smith',
      total: '$89.50',
      status: 'pending',
      date: 'Oct 7, 2024',
    },
    {
      id: '1003',
      customer: 'Bob Johnson',
      total: '$234.75',
      status: 'shipped',
      date: 'Oct 6, 2024',
    },
  ];

  return (
    <AppLayout>
      <Page
        title="Orders"
        subtitle="Manage your store orders"
        primaryAction={{
          content: 'Create order',
          onAction: () => console.log('Create order'),
        }}
        secondaryActions={[
          {
            content: 'Export',
            onAction: () => console.log('Export orders'),
          },
        ]}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <ResourceList
                resourceName={{singular: 'order', plural: 'orders'}}
                items={orders}
                renderItem={(item) => {
                  const {id, customer, total, status, date} = item;
                  const statusColor = status === 'fulfilled' ? 'success' : 
                                    status === 'shipped' ? 'info' : 'warning';
                  
                  return (
                    <ResourceItem
                      id={id}
                      accessibilityLabel={`View details for order ${id}`}
                      onClick={() => console.log(`View order ${id}`)}
                    >
                      <Stack alignment="center">
                        <Avatar customer size="medium" name={customer} />
                        <Stack.Item fill>
                          <Stack vertical spacing="extraTight">
                            <Text variant="bodyMd" fontWeight="bold">
                              Order #{id}
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                              {customer} • {date}
                            </Text>
                          </Stack>
                        </Stack.Item>
                        <Stack vertical alignment="trailing">
                          <Text variant="bodyMd" fontWeight="bold">
                            {total}
                          </Text>
                          <Badge status={statusColor}>{status}</Badge>
                        </Stack>
                      </Stack>
                    </ResourceItem>
                  );
                }}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
