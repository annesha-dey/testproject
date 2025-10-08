import { useState } from "react";
import { Card, TextContainer, Text, Banner } from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";

export function ProductsCard() {
  const { t } = useTranslation();
  const [isPopulating, setIsPopulating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const productsCount = 5;

  const {
    data,
    refetch: refetchProductCount,
    isLoading: isLoadingCount,
  } = useQuery({
    queryKey: ["productCount"],
    queryFn: async () => {
      const backendUrl = "https://277949e9b10a.ngrok-free.app";
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get("shop");
      
      const response = await fetch(`${backendUrl}/api/products/count?shop=${shop}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
    },
    refetchOnWindowFocus: false,
  });

  const handlePopulate = async () => {
    setIsPopulating(true);
    setMessage("");
    
    const backendUrl = "https://277949e9b10a.ngrok-free.app";
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get("shop");
    
    const response = await fetch(`${backendUrl}/api/products?shop=${shop}`, { 
      method: "POST",
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      await refetchProductCount();
      setMessage(t("ProductsCard.productsCreatedToast", { count: productsCount }));
      setMessageType("success");
    } else {
      setMessage(t("ProductsCard.errorCreatingProductsToast"));
      setMessageType("critical");
    }

    setIsPopulating(false);
  };

  return (
    <>
      {message && (
        <Banner status={messageType} onDismiss={() => setMessage("")}>
          {message}
        </Banner>
      )}
      <Card
        title={t("ProductsCard.title")}
        sectioned
        primaryFooterAction={{
          content: t("ProductsCard.populateProductsButton", {
            count: productsCount,
          }),
          onAction: handlePopulate,
          loading: isPopulating,
        }}
      >
        <TextContainer spacing="loose">
          <p>{t("ProductsCard.description")}</p>
          <Text as="h4" variant="headingMd">
            {t("ProductsCard.totalProductsHeading")}
            <Text variant="bodyMd" as="p" fontWeight="semibold">
              {isLoadingCount ? "-" : data?.count}
            </Text>
          </Text>
        </TextContainer>
      </Card>
    </>
  );
}
