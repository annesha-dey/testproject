import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  Stack,
  Badge,
  List,
  Banner,
  Spinner,
  Frame,
  Toast
} from '@shopify/polaris';

const BillingPlans = ({ shop, onPlanSelected }) => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchPlansAndSubscription();
  }, [shop]);

  const fetchPlansAndSubscription = async () => {
    try {
      setLoading(true);
      
      // Fetch available plans
      const plansResponse = await apiRequest('/api/billing/plans');
      const plansData = await plansResponse.json();
      
      if (plansData.success) {
        setPlans(plansData.plans);
      }

      // Fetch current subscription if shop is provided
      if (shop) {
        const subResponse = await apiRequest(`/api/billing/subscription?shop=${shop}`);
        const subData = await subResponse.json();
        
        if (subData.success) {
          setCurrentSubscription(subData.subscription);
        }
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setToast({ content: 'Failed to load billing information', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!shop) {
      setToast({ content: 'Shop parameter is required', error: true });
      return;
    }

    try {
      setSubscribing(planId);
      
      const response = await apiRequest(`/api/billing/subscribe?shop=${shop}`, {
        method: 'POST',
        body: JSON.stringify({ planId })
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to Shopify billing confirmation
        window.location.href = data.confirmationUrl;
      } else {
        setToast({ content: data.error || 'Failed to create subscription', error: true });
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setToast({ content: 'Failed to create subscription', error: true });
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    try {
      const response = await apiRequest(`/api/billing/cancel?shop=${shop}`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        setToast({ content: 'Subscription cancelled successfully' });
        fetchPlansAndSubscription(); // Refresh data
      } else {
        setToast({ content: data.error || 'Failed to cancel subscription', error: true });
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setToast({ content: 'Failed to cancel subscription', error: true });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getPlanBadge = (planId) => {
    if (currentSubscription && currentSubscription.planId === planId) {
      return <Badge status="success">Current Plan</Badge>;
    }
    return null;
  };

  const isCurrentPlan = (planId) => {
    return currentSubscription && currentSubscription.planId === planId;
  };

  if (loading) {
    return (
      <Page title="Billing Plans">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner size="large" />
                <Text variant="bodyMd">Loading billing plans...</Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Frame>
      <Page title="Choose Your Plan">
        <Layout>
          {currentSubscription && currentSubscription.status === 'ACTIVE' && (
            <Layout.Section>
              <Banner
                title="Active Subscription"
                status="success"
                action={{
                  content: 'Cancel Subscription',
                  onAction: handleCancelSubscription
                }}
              >
                <Text>
                  You are currently subscribed to the {currentSubscription.name} plan.
                  {currentSubscription.trialEndsOn && new Date(currentSubscription.trialEndsOn) > new Date() && (
                    ` Your trial ends on ${new Date(currentSubscription.trialEndsOn).toLocaleDateString()}.`
                  )}
                </Text>
              </Banner>
            </Layout.Section>
          )}

          <Layout.Section>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {plans.map((plan) => (
                <Card key={plan.planId}>
                  <div style={{ padding: '1.5rem' }}>
                    <Stack vertical spacing="loose">
                      <Stack distribution="equalSpacing" alignment="center">
                        <Text variant="headingMd">{plan.name}</Text>
                        {getPlanBadge(plan.planId)}
                      </Stack>
                      
                      <Stack alignment="baseline" spacing="tight">
                        <Text variant="headingLg">{formatPrice(plan.price)}</Text>
                        <Text variant="bodyMd" color="subdued">
                          /{plan.interval === 'EVERY_30_DAYS' ? 'month' : 'year'}
                        </Text>
                      </Stack>

                      {plan.trialDays > 0 && (
                        <Badge status="info">{plan.trialDays} day free trial</Badge>
                      )}

                      <Stack vertical spacing="tight">
                        <Text variant="bodyMd" fontWeight="semibold">Features:</Text>
                        <List>
                          {plan.features.map((feature, index) => (
                            <List.Item key={index}>{feature}</List.Item>
                          ))}
                        </List>
                      </Stack>

                      <Stack vertical spacing="tight">
                        <Text variant="bodyMd" fontWeight="semibold">Limits:</Text>
                        <List>
                          <List.Item>
                            Products: {plan.limits.products === -1 ? 'Unlimited' : plan.limits.products}
                          </List.Item>
                          <List.Item>
                            Orders: {plan.limits.orders === -1 ? 'Unlimited' : plan.limits.orders}
                          </List.Item>
                          <List.Item>
                            API Calls: {plan.limits.apiCalls === -1 ? 'Unlimited' : plan.limits.apiCalls}
                          </List.Item>
                        </List>
                      </Stack>

                      <Button
                        primary={!isCurrentPlan(plan.planId)}
                        disabled={isCurrentPlan(plan.planId)}
                        loading={subscribing === plan.planId}
                        onClick={() => handleSubscribe(plan.planId)}
                        fullWidth
                      >
                        {isCurrentPlan(plan.planId) 
                          ? 'Current Plan' 
                          : subscribing === plan.planId 
                            ? 'Processing...' 
                            : 'Choose Plan'
                        }
                      </Button>
                    </Stack>
                  </div>
                </Card>
              ))}
            </div>
          </Layout.Section>
        </Layout>

        {toast && (
          <Toast
            content={toast.content}
            error={toast.error}
            onDismiss={() => setToast(null)}
          />
        )}
      </Page>
    </Frame>
  );
};

export default BillingPlans;
