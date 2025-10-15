import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Page,
  Layout,
  Text,
  Button,
  Stack,
  Collapsible,
  TextContainer,
  Link,
  List,
  Heading,
} from "@shopify/polaris";
import AppLayout from "../components/Layout/AppLayout";

export default function HelpPage() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get("shop");
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const faqItems = [
    {
      id: 'getting-started',
      question: 'How do I get started with the Profit Analyser?',
      answer: 'After installing the app, it will automatically fetch your historical data. You can view your profit analytics on the Dashboard and Analytics pages. The Day 1 data sync may take a few minutes to complete.'
    },
    {
      id: 'profit-calculation',
      question: 'How are profit margins calculated?',
      answer: 'Profit margins are calculated using the formula: (Revenue - Cost of Goods) / Revenue × 100. Make sure to set up product costs in your Shopify admin for accurate calculations.'
    },
    {
      id: 'data-sync',
      question: 'How often is my data updated?',
      answer: 'Your data is synced in real-time. New orders and changes to existing orders are reflected immediately in your analytics dashboard.'
    },
    {
      id: 'export-data',
      question: 'Can I export my analytics data?',
      answer: 'Yes, you can export your analytics data using the "Export report" button on the Analytics page. Data can be exported in CSV format.'
    },
    {
      id: 'troubleshooting',
      question: 'What should I do if my data looks incorrect?',
      answer: 'First, ensure that your product costs are set up correctly in Shopify. If issues persist, try triggering a manual data sync from the Settings page or contact our support team.'
    }
  ];

  return (
    <AppLayout>
      <Page
        title="Help and Documentation"
        subtitle="Get help and learn how to use the Profit Analyser"
      >
        <Layout>
          <Layout.Section oneThird>
            <Card sectioned>
              <Stack vertical>
                <Heading>Quick Links</Heading>
                <Stack vertical spacing="tight">
                  <Link onClick={() => console.log('View getting started guide')}>
                    📚 Getting Started Guide
                  </Link>
                  <Link onClick={() => console.log('View video tutorials')}>
                    🎥 Video Tutorials
                  </Link>
                  <Link onClick={() => console.log('View API documentation')}>
                    🔧 API Documentation
                  </Link>
                  <Link onClick={() => console.log('Contact support')}>
                    💬 Contact Support
                  </Link>
                </Stack>
              </Stack>
            </Card>

            <Card sectioned>
              <Stack vertical>
                <Heading>Support</Heading>
                <Text variant="bodyMd">
                  Need help? Our support team is here to assist you.
                </Text>
                <Stack vertical spacing="tight">
                  <Button 
                    variant="primary" 
                    onClick={() => console.log('Open support chat')}
                  >
                    Start Live Chat
                  </Button>
                  <Button onClick={() => console.log('Send email')}>
                    Send Email
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Layout.Section>

          <Layout.Section twoThirds>
            <Card sectioned>
              <Stack vertical>
                <Heading>Frequently Asked Questions</Heading>
                <Stack vertical spacing="loose">
                  {faqItems.map((item) => (
                    <div key={item.id}>
                      <Button
                        plain
                        onClick={() => toggleSection(item.id)}
                        ariaExpanded={openSections[item.id]}
                        ariaControls={`collapsible-${item.id}`}
                      >
                        <Stack alignment="center">
                          <Text variant="bodyMd" fontWeight="bold">
                            {openSections[item.id] ? '▼' : '▶'} {item.question}
                          </Text>
                        </Stack>
                      </Button>
                      <Collapsible
                        open={openSections[item.id]}
                        id={`collapsible-${item.id}`}
                        transition={{duration: '200ms', timingFunction: 'ease-in-out'}}
                      >
                        <div style={{ paddingTop: '12px', paddingLeft: '20px' }}>
                          <TextContainer>
                            <Text variant="bodyMd">{item.answer}</Text>
                          </TextContainer>
                        </div>
                      </Collapsible>
                    </div>
                  ))}
                </Stack>
              </Stack>
            </Card>

            <Card sectioned>
              <Stack vertical>
                <Heading>Feature Overview</Heading>
                <List type="bullet">
                  <List.Item>
                    <strong>Dashboard:</strong> Overview of your store's key metrics and recent activity
                  </List.Item>
                  <List.Item>
                    <strong>Analytics:</strong> Detailed profit analysis with trends and insights
                  </List.Item>
                  <List.Item>
                    <strong>Orders:</strong> View and analyze individual order profitability
                  </List.Item>
                  <List.Item>
                    <strong>Products:</strong> Track product performance and profit margins
                  </List.Item>
                  <List.Item>
                    <strong>Customers:</strong> Analyze customer lifetime value and behavior
                  </List.Item>
                  <List.Item>
                    <strong>Integrations:</strong> Connect with your favorite tools and services
                  </List.Item>
                </List>
              </Stack>
            </Card>

            <Card sectioned>
              <Stack vertical>
                <Heading>System Requirements</Heading>
                <Text variant="bodyMd">
                  The Profit Analyser works with all Shopify plans and requires the following permissions:
                </Text>
                <List type="bullet">
                  <List.Item>Read orders</List.Item>
                  <List.Item>Read products</List.Item>
                  <List.Item>Read customers</List.Item>
                  <List.Item>Read analytics</List.Item>
                </List>
              </Stack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </AppLayout>
  );
}
