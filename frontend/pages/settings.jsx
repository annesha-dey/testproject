import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Page,
  Layout,
  Text,
  TextField,
  Button,
  Stack,
  Heading,
  FormLayout,
  Select,
  Checkbox,
} from "@shopify/polaris";
import AppLayout from "../components/Layout/AppLayout";

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");
  
  const [appName, setAppName] = useState('Ring a Roses App');
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(false);
  const [language, setLanguage] = useState('en');

  const languageOptions = [
    {label: 'English', value: 'en'},
    {label: 'Spanish', value: 'es'},
    {label: 'French', value: 'fr'},
    {label: 'German', value: 'de'},
  ];

  const handleSave = () => {
    console.log('Settings saved:', {
      appName,
      notifications,
      autoSync,
      language,
    });
  };

  return (
    <AppLayout>
      <Page
      title="Settings"
      subtitle="Configure your app preferences"
      primaryAction={{
        content: 'Save settings',
        onAction: handleSave,
      }}
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Heading>⚙️ General Settings</Heading>
              <FormLayout>
                <TextField
                  label="App Name"
                  value={appName}
                  onChange={setAppName}
                  helpText="The name displayed in your store"
                />
                
                <Select
                  label="Language"
                  options={languageOptions}
                  value={language}
                  onChange={setLanguage}
                />
              </FormLayout>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Heading>🔔 Notifications</Heading>
              <Stack vertical spacing="tight">
                <Checkbox
                  label="Enable email notifications"
                  checked={notifications}
                  onChange={setNotifications}
                />
                <Text variant="bodySm" tone="subdued">
                  Receive updates about orders, customers, and app performance
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Heading>🔄 Synchronization</Heading>
              <Stack vertical spacing="tight">
                <Checkbox
                  label="Auto-sync data"
                  checked={autoSync}
                  onChange={setAutoSync}
                />
                <Text variant="bodySm" tone="subdued">
                  Automatically synchronize data with Shopify every hour
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card sectioned>
            <Stack vertical spacing="loose">
              <Heading>🔧 Advanced</Heading>
              <Stack vertical spacing="tight">
                <Text variant="bodyMd">API Version: v2024-01</Text>
                <Text variant="bodyMd">App Version: 1.0.0</Text>
                <Text variant="bodyMd">Last Sync: Oct 8, 2024 at 10:30 PM</Text>
              </Stack>
              <Stack>
                <Button onClick={() => console.log('Clear cache')}>
                  Clear Cache
                </Button>
                <Button onClick={() => console.log('Reset settings')}>
                  Reset to Defaults
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
      </Page>
    </AppLayout>
  );
}
