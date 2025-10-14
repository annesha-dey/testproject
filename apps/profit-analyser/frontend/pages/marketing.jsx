import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Page,
  Layout,
  Text,
  Button,
  Stack,
  EmptyState,
} from "@shopify/polaris";

export default function MarketingPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  return (
    <Page
      title="Marketing"
      subtitle="Promote your products and grow your business"
      primaryAction={{
        content: 'Create campaign',
        onAction: () => console.log('Create campaign'),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <EmptyState
              heading="Start your marketing campaigns"
              action={{
                content: 'Create your first campaign',
                onAction: () => console.log('Create campaign'),
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Create email campaigns, social media ads, and promotional content to reach more customers.</p>
            </EmptyState>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
