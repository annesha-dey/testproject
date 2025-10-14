import { useState, useEffect } from "react";
import { ProductsCard } from "../components";
import AppLayout from "../components/Layout/AppLayout";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Page,
  Layout,
  Text,
  Badge,
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!shop) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔄 [PRODUCTS PAGE] Fetching products for shop: ${shop}`);
        
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
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ [PRODUCTS PAGE] Products data received:`, data);
        
        // Extract top products from dashboard data
        const topProducts = data.data?.topProducts || [];
        
        // Format products for display
        const formattedProducts = topProducts.map(product => ({
          id: product.id,
          title: product.title || 'Untitled Product',
          status: 'active', // Default status since we don't have this in the API response
          inventory: 'N/A', // We don't have inventory data in current API
          price: `$${parseFloat(product.price || 0).toFixed(2)}`,
          image: product.image || 'https://via.placeholder.com/80x80?text=Product',
        }));
        
        setProducts(formattedProducts);
        console.log(`✅ [PRODUCTS PAGE] Formatted products:`, formattedProducts);
        
      } catch (err) {
        console.error(`❌ [PRODUCTS PAGE] Error fetching products:`, err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [shop]);

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
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Text>Loading products...</Text>
                </div>
              ) : error ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Text tone="critical">Error loading products: {error}</Text>
                </div>
              ) : products.length === 0 ? (
                <EmptyState
                  heading="No products found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>You don't have any products yet. When you add products, they'll show up here.</p>
                </EmptyState>
              ) : (
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
                                Inventory: {inventory}
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
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
