import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Banner, Layout, Page } from "@shopify/polaris";

export default function ExitIframe() {
  const { search } = useLocation();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (search) {
      const params = new URLSearchParams(search);
      const shop = params.get("shop");

      if (shop) {
        const appUrl = import.meta.env.VITE_SHOPIFY_APP_URL;
        const redirectUrl = `${appUrl}?shop=${shop}`;
        window.top.location.href = redirectUrl;
      } else {
        setShowWarning(true);
      }
    }
  }, [search]);

  return showWarning ? (
    <Page narrowWidth>
      <Layout>
        <Layout.Section>
          <div style={{ marginTop: "100px" }}>
            <Banner title="Redirecting outside of Shopify" status="warning">
              Apps can only use /exitiframe to reach Shopify or the app itself.
            </Banner>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  ) : null;
}
