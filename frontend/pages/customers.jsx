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
} from "@shopify/polaris";

export default function CustomersPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  const customers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      orders: 5,
      spent: '$425.00',
      location: 'New York, USA',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      orders: 3,
      spent: '$189.50',
      location: 'London, UK',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      orders: 8,
      spent: '$734.75',
      location: 'Toronto, Canada',
    },
  ];

  return (
    <Page
      title="Customers"
      subtitle="Manage your store customers"
      primaryAction={{
        content: 'Add customer',
        onAction: () => console.log('Add customer'),
      }}
      secondaryActions={[
        {
          content: 'Import',
          onAction: () => console.log('Import customers'),
        },
        {
          content: 'Export',
          onAction: () => console.log('Export customers'),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{singular: 'customer', plural: 'customers'}}
              items={customers}
              renderItem={(item) => {
                const {id, name, email, orders, spent, location} = item;
                
                return (
                  <ResourceItem
                    id={id}
                    accessibilityLabel={`View details for ${name}`}
                    onClick={() => console.log(`View customer ${id}`)}
                  >
                    <Stack alignment="center">
                      <Avatar customer size="medium" name={name} />
                      <Stack.Item fill>
                        <Stack vertical spacing="extraTight">
                          <Text variant="bodyMd" fontWeight="bold">
                            {name}
                          </Text>
                          <Text variant="bodySm" tone="subdued">
                            {email}
                          </Text>
                          <Text variant="bodySm" tone="subdued">
                            {location}
                          </Text>
                        </Stack>
                      </Stack.Item>
                      <Stack vertical alignment="trailing">
                        <Text variant="bodyMd" fontWeight="bold">
                          {spent} spent
                        </Text>
                        <Text variant="bodySm" tone="subdued">
                          {orders} orders
                        </Text>
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
  );
}
