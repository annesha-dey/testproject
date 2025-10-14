import { useState, useEffect } from "react";
import { ProductsCard } from "../components";
import AppLayout from "../components/Layout/AppLayout";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Page,
  Layout,
  Text,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Stack,
  Button,
  EmptyState,
} from "@shopify/polaris";

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  const products = [
    {
      id: '1',
      title: 'Classic T-Shirt',
      status: 'active',
      inventory: 45,
      price: '$29.99',
      image: 'https://via.placeholder.com/80x80?text=T-Shirt',
    },
    {
      id: '2',
      title: 'Denim Jeans',
      status: 'active',
      inventory: 23,
      price: '$79.99',
      image: 'https://via.placeholder.com/80x80?text=Jeans',
    },
    {
      id: '3',
      title: 'Running Shoes',
      status: 'draft',
      inventory: 0,
      price: '$129.99',
      image: 'https://via.placeholder.com/80x80?text=Shoes',
    },
  ];

  return (
    <AppLayout>
      <Page
      title="Products"
      subtitle="Manage your store products"
      primaryAction={{
        content: 'Add product',
        onAction: () => console.log('Add product'),
      }}
      secondaryActions={[
        {
          content: 'Import',
          onAction: () => console.log('Import products'),
        },
        {
          content: 'Export',
          onAction: () => console.log('Export products'),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{singular: 'product', plural: 'products'}}
              items={products}
              renderItem={(item) => {
                const {id, title, status, inventory, price, image} = item;
                const statusColor = status === 'active' ? 'success' : 'warning';
                
                return (
                  <ResourceItem
                    id={id}
                    accessibilityLabel={`View details for ${title}`}
                    onClick={() => console.log(`View product ${id}`)}
                    media={<Thumbnail source={image} alt={title} />}
                  >
                    <Stack alignment="center">
                      <Stack.Item fill>
                        <Stack vertical spacing="extraTight">
                          <Text variant="bodyMd" fontWeight="bold">
                            {title}
                          </Text>
                          <Text variant="bodySm" tone="subdued">
                            {inventory} in stock
                          </Text>
                        </Stack>
                      </Stack.Item>
                      <Stack vertical alignment="trailing">
                        <Text variant="bodyMd" fontWeight="bold">
                          {price}
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
