import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BillingPlans from "../components/BillingPlans";
import AppLayout from "../components/Layout/AppLayout";
import {
  Page,
  Banner,
  Layout,
  Card,
  Text,
  Button,
  Stack,
  Badge,
  DisplayText,
  Heading,
  Subheading,
  ProgressBar,
  CalloutCard,
  ResourceList,
  ResourceItem,
  Avatar,
  Icon,
  Divider,
} from '@shopify/polaris';
// Temporarily remove problematic icons
// import { 
//   CreditCardMinor, 
//   CalendarMinor, 
//   CheckmarkMinor,
//   AlertTriangleMinor,
//   InfoMinor 
// } from '@shopify/polaris-icons';

const BillingPage = () => {
  const [searchParams] = useSearchParams();
  const [shop, setShop] = useState('');
  const [billingStatus, setBillingStatus] = useState(null);

  useEffect(() => {
    const shopParam = searchParams.get('shop');
    const billingSuccess = searchParams.get('billing_success');
    const billingError = searchParams.get('billing_error');
    const plan = searchParams.get('plan');

    if (shopParam) {
      setShop(shopParam);
    }

    if (billingSuccess === 'true') {
      setBillingStatus({
        type: 'success',
        message: `Successfully subscribed to ${plan || 'selected'} plan!`,
        plan
      });
    } else if (billingError) {
      let errorMessage = 'Billing process failed';
      
      switch (billingError) {
        case 'no_charge_id':
          errorMessage = 'No charge ID received from Shopify';
          break;
        case 'activation_failed':
          errorMessage = 'Failed to activate subscription';
          break;
        default:
          errorMessage = `Billing error: ${billingError}`;
      }

      setBillingStatus({
        type: 'error',
        message: errorMessage
      });
    }
  }, [searchParams]);

  const handleBackToDashboard = () => {
    window.location.href = `/home?shop=${shop}`;
  };

  return (
    <AppLayout>
      <Page
      title="Billing & Subscriptions"
      subtitle={shop ? `Manage billing for ${shop}` : 'Manage your app subscriptions'}
      backAction={shop ? {
        content: 'Back to Dashboard',
        onAction: handleBackToDashboard
      } : undefined}
      primaryAction={{
        content: 'View billing history',
        onAction: () => console.log('View billing history'),
      }}
      secondaryActions={[
        {
          content: 'Download invoice',
          onAction: () => console.log('Download invoice'),
        },
        {
          content: 'Contact support',
          onAction: () => window.open('mailto:support@ringaroses.com'),
        },
      ]}
    >
      <Layout>
        {billingStatus && (
          <Layout.Section>
            <Banner
              title={billingStatus.type === 'success' ? 'Subscription Successful!' : 'Billing Error'}
              status={billingStatus.type === 'success' ? 'success' : 'critical'}
              onDismiss={() => setBillingStatus(null)}
            >
              <Text>{billingStatus.message}</Text>
              {billingStatus.type === 'success' && (
                <div style={{ marginTop: '1rem' }}>
                  <Button primary onClick={handleBackToDashboard}>
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </Banner>
          </Layout.Section>
        )}

        {shop && (
          <>
            <Layout.Section>
              <Layout>
                <Layout.Section oneHalf>
                  <Card sectioned>
                    <Stack vertical spacing="tight">
                      <Stack alignment="center">
                        <Heading>💳 Current Plan</Heading>
                      </Stack>
                      <DisplayText size="medium">Free Trial</DisplayText>
                      <Text variant="bodyMd" tone="subdued">
                        7 days remaining
                      </Text>
                      <ProgressBar progress={70} size="small" />
                      <Text variant="bodySm" tone="subdued">
                        Trial expires on March 15, 2024
                      </Text>
                      <Divider />
                      <Stack distribution="equalSpacing">
                        <Text variant="bodyMd" fontWeight="bold">Features included:</Text>
                      </Stack>
                      <Stack vertical spacing="extraTight">
                        <Stack alignment="center">
                          <Text variant="bodySm">✅ Basic product management</Text>
                        </Stack>
                        <Stack alignment="center">
                          <Text variant="bodySm">✅ Up to 100 products</Text>
                        </Stack>
                        <Stack alignment="center">
                          <Text variant="bodySm">✅ Email support</Text>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Card>
                </Layout.Section>

                <Layout.Section oneHalf>
                  <Card sectioned>
                    <Stack vertical spacing="tight">
                      <Stack alignment="center">
                        <Heading>📅 Billing Information</Heading>
                      </Stack>
                      <Stack distribution="equalSpacing">
                        <Text variant="bodyMd">Next billing date:</Text>
                        <Text variant="bodyMd" fontWeight="bold">March 15, 2024</Text>
                      </Stack>
                      <Stack distribution="equalSpacing">
                        <Text variant="bodyMd">Billing cycle:</Text>
                        <Text variant="bodyMd">Monthly</Text>
                      </Stack>
                      <Stack distribution="equalSpacing">
                        <Text variant="bodyMd">Payment method:</Text>
                        <Badge status="attention">Not set</Badge>
                      </Stack>
                      <Divider />
                      <CalloutCard
                        title="Set up billing"
                        illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa6.svg"
                        primaryAction={{
                          content: 'Add payment method',
                          onAction: () => console.log('Add payment method'),
                        }}
                      >
                        <p>Add a payment method to continue using the app after your trial ends.</p>
                      </CalloutCard>
                    </Stack>
                  </Card>
                </Layout.Section>
              </Layout>
            </Layout.Section>

            <Layout.Section>
              <Card>
                <Card.Header>
                  <Heading>Recent Activity</Heading>
                </Card.Header>
                <ResourceList
                  resourceName={{singular: 'activity', plural: 'activities'}}
                  items={[
                    {
                      id: '1',
                      type: 'Trial started',
                      date: 'March 8, 2024',
                      status: 'success',
                      description: 'Free trial activated for 7 days',
                    },
                    {
                      id: '2',
                      type: 'App installed',
                      date: 'March 8, 2024', 
                      status: 'success',
                      description: 'Ring a Roses app successfully installed',
                    },
                  ]}
                  renderItem={(item) => {
                    const {id, type, date, status, description} = item;
                    return (
                      <ResourceItem
                        id={id}
                        accessibilityLabel={`View details for ${type}`}
                      >
                        <Stack alignment="center">
                          <Avatar 
                            size="small" 
                            initials={type.charAt(0)} 
                          />
                          <Stack.Item fill>
                            <Stack vertical spacing="extraTight">
                              <Text variant="bodyMd" fontWeight="bold">
                                {type}
                              </Text>
                              <Text variant="bodySm" tone="subdued">
                                {description}
                              </Text>
                            </Stack>
                          </Stack.Item>
                          <Stack vertical alignment="trailing">
                            <Badge status={status}>{status}</Badge>
                            <Text variant="bodySm" tone="subdued">
                              {date}
                            </Text>
                          </Stack>
                        </Stack>
                      </ResourceItem>
                    );
                  }}
                />
              </Card>
            </Layout.Section>

            <Layout.Section>
              <BillingPlans shop={shop} />
            </Layout.Section>
          </>
        )}

        {!shop && (
          <Layout.Section>
            <Card sectioned>
              <Stack vertical spacing="loose" alignment="center">
                <Text variant="headingLg">⚠️</Text>
                <Heading>Shop Parameter Required</Heading>
                <Text alignment="center">
                  Please access this page from your Shopify app dashboard or include the shop parameter in the URL.
                </Text>
                <Text variant="bodyMd" tone="subdued" alignment="center">
                  Example: /billing?shop=your-shop.myshopify.com
                </Text>
              </Stack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
      </Page>
    </AppLayout>
  );
};

export default BillingPage;
