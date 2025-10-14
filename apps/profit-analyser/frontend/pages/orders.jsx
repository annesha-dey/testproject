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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!shop) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔄 [ORDERS PAGE] Fetching orders for shop: ${shop}`);
        
        const backendUrl = "https://e43e420e9e45.ngrok-free.app";
        const response = await fetch(`${backendUrl}/api/profit-analyser/analytics/dashboard?shop=${shop}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ [ORDERS PAGE] Orders data received:`, data);
        
        // Extract recent orders from dashboard data
        const recentOrders = data.data?.recentOrders || [];
        
        // Format orders for display
        const formattedOrders = recentOrders.map(order => ({
          id: order.id,
          customer: order.name || 'Unknown Customer',
          total: `$${parseFloat(order.total || 0).toFixed(2)}`,
          status: order.financial_status || 'pending',
          date: new Date(order.date || order.created_at).toLocaleDateString(),
        }));
        
        setOrders(formattedOrders);
        console.log(`✅ [ORDERS PAGE] Formatted orders:`, formattedOrders);
        
      } catch (err) {
        console.error(`❌ [ORDERS PAGE] Error fetching orders:`, err);
        setError(err.message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [shop]);

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
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Text>Loading orders...</Text>
                </div>
              ) : error ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Text tone="critical">Error loading orders: {error}</Text>
                </div>
              ) : orders.length === 0 ? (
                <EmptyState
                  heading="No orders found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>You don't have any orders yet. When you get orders, they'll show up here.</p>
                </EmptyState>
              ) : (
                <ResourceList
                  resourceName={{singular: 'order', plural: 'orders'}}
                  items={orders}
                  renderItem={(item) => {
                    const {id, customer, total, status, date} = item;
                    const statusColor = status === 'fulfilled' ? 'success' : 
                                      status === 'shipped' ? 'info' : 
                                      status === 'paid' ? 'success' : 'warning';
                    
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
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
