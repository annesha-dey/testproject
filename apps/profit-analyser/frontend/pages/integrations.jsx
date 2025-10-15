import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Page,
  Layout,
  Text,
  Button,
  Stack,
  Badge,
  ResourceList,
  ResourceItem,
  Avatar,
  ButtonGroup,
} from "@shopify/polaris";
import AppLayout from "../components/Layout/AppLayout";

export default function IntegrationsPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  const integrations = [
    {
      id: '1',
      name: 'Google Analytics',
      description: 'Track website traffic and user behavior',
      status: 'connected',
      category: 'Analytics',
    },
    {
      id: '2',
      name: 'Facebook Pixel',
      description: 'Track conversions and optimize ads',
      status: 'available',
      category: 'Marketing',
    },
    {
      id: '3',
      name: 'Mailchimp',
      description: 'Email marketing and automation',
      status: 'available',
      category: 'Email Marketing',
    },
    {
      id: '4',
      name: 'QuickBooks',
      description: 'Sync financial data and accounting',
      status: 'available',
      category: 'Accounting',
    },
    {
      id: '5',
      name: 'Slack',
      description: 'Get notifications in your Slack workspace',
      status: 'connected',
      category: 'Communication',
    },
  ];

  const handleConnect = (integrationId) => {
    console.log(`Connect integration: ${integrationId}`);
  };

  const handleDisconnect = (integrationId) => {
    console.log(`Disconnect integration: ${integrationId}`);
  };

  return (
    <AppLayout>
      <Page
        title="App Integrations"
        subtitle="Connect your favorite tools and services"
        primaryAction={{
          content: 'Browse all integrations',
          onAction: () => console.log('Browse integrations'),
        }}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <ResourceList
                resourceName={{singular: 'integration', plural: 'integrations'}}
                items={integrations}
                renderItem={(item) => {
                  const {id, name, description, status, category} = item;
                  
                  return (
                    <ResourceItem
                      id={id}
                      accessibilityLabel={`View details for ${name}`}
                    >
                      <Stack alignment="center">
                        <Avatar size="medium" name={name} />
                        <Stack.Item fill>
                          <Stack vertical spacing="extraTight">
                            <Stack alignment="center">
                              <Text variant="bodyMd" fontWeight="bold">
                                {name}
                              </Text>
                              <Badge tone={status === 'connected' ? 'success' : 'info'}>
                                {status === 'connected' ? 'Connected' : 'Available'}
                              </Badge>
                            </Stack>
                            <Text variant="bodySm" tone="subdued">
                              {description}
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                              Category: {category}
                            </Text>
                          </Stack>
                        </Stack.Item>
                        <ButtonGroup>
                          {status === 'connected' ? (
                            <>
                              <Button onClick={() => console.log(`Configure ${id}`)}>
                                Configure
                              </Button>
                              <Button 
                                tone="critical" 
                                onClick={() => handleDisconnect(id)}
                              >
                                Disconnect
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="primary" 
                              onClick={() => handleConnect(id)}
                            >
                              Connect
                            </Button>
                          )}
                        </ButtonGroup>
                      </Stack>
                    </ResourceItem>
                  );
                }}
              />
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card sectioned>
              <Stack vertical>
                <Text variant="headingMd">Need a custom integration?</Text>
                <Text variant="bodyMd">
                  Contact our support team to discuss custom integrations for your specific needs.
                </Text>
                <Button onClick={() => console.log('Contact support')}>
                  Contact Support
                </Button>
              </Stack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
