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

export default function AppsPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");

  return (
    <Page
      title="Apps"
      subtitle="Manage your installed apps"
      primaryAction={{
        content: 'Visit App Store',
        onAction: () => window.open('https://apps.shopify.com', '_blank'),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <EmptyState
              heading="Discover apps to grow your business"
              action={{
                content: 'Browse App Store',
                onAction: () => window.open('https://apps.shopify.com', '_blank'),
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Find apps to help with marketing, inventory, customer service, and more.</p>
            </EmptyState>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
