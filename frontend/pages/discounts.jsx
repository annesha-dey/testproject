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

export default function DiscountsPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  return (
    <Page
      title="Discounts"
      subtitle="Create and manage discount codes"
      primaryAction={{
        content: 'Create discount',
        onAction: () => console.log('Create discount'),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <EmptyState
              heading="Manage your discount codes"
              action={{
                content: 'Create discount code',
                onAction: () => console.log('Create discount'),
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Create percentage discounts, fixed amount discounts, and free shipping offers to attract customers.</p>
            </EmptyState>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
