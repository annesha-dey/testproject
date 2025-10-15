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
  Spinner,
} from "@shopify/polaris";
import AppLayout from "../components/Layout/AppLayout";

export default function CustomersPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!shop) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔄 [CUSTOMERS PAGE] Fetching customers for shop: ${shop}`);
        
        const backendUrl = "https://e43e420e9e45.ngrok-free.app";
        const response = await fetch(`${backendUrl}/api/profit-analyser/customers/list?shop=${shop}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch customers: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ [CUSTOMERS PAGE] Customers data received:`, data);
        
        if (data.success && data.data?.customers) {
          setCustomers(data.data.customers);
          console.log(`✅ [CUSTOMERS PAGE] Set ${data.data.customers.length} customers`);
        } else {
          console.warn('⚠️ [CUSTOMERS PAGE] No customers data in response');
          setCustomers([]);
        }
        
      } catch (err) {
        console.error(`❌ [CUSTOMERS PAGE] Error fetching customers:`, err);
        setError(err.message);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [shop]);

  return (
    <AppLayout>
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
            {loading ? (
              <Card sectioned>
                <Stack alignment="center">
                  <Spinner size="large" />
                  <Text variant="bodyMd">Loading customers...</Text>
                </Stack>
              </Card>
            ) : error ? (
              <Card sectioned>
                <Stack vertical>
                  <Text variant="headingMd" tone="critical">Error loading customers</Text>
                  <Text variant="bodyMd">{error}</Text>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </Stack>
              </Card>
            ) : customers.length === 0 ? (
              <Card sectioned>
                <Stack vertical alignment="center">
                  <Text variant="headingMd">No customers found</Text>
                  <Text variant="bodyMd">Your customer data will appear here once customers place orders.</Text>
                </Stack>
              </Card>
            ) : (
              <Card>
                <ResourceList
                  resourceName={{singular: 'customer', plural: 'customers'}}
                  items={customers}
                  renderItem={(item) => {
                    const {id, name, email, totalOrders, totalSpent, location} = item;
                    
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
                                {location || 'Location not available'}
                              </Text>
                            </Stack>
                          </Stack.Item>
                          <Stack vertical alignment="trailing">
                            <Text variant="bodyMd" fontWeight="bold">
                              ${totalSpent.toFixed(2)} spent
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                              {totalOrders} orders
                            </Text>
                          </Stack>
                        </Stack>
                      </ResourceItem>
                    );
                  }}
                />
              </Card>
            )}
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
