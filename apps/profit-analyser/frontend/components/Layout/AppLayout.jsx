import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, redirectToLogin } from '../../utils/auth';
import {
  AppProvider,
  Frame,
  Navigation,
  TopBar,
  Toast,
  Loading,
  ContextualSaveBar,
} from '@shopify/polaris';
// Temporarily remove problematic icons
// import {
//   HomeMinor,
//   OrdersMinor,
//   ProductsMinor,
//   CustomersMinor,
//   AnalyticsMinor,
//   MarketingMinor,
//   DiscountsMinor,
//   AppsMinor,
//   SettingsMinor,
//   CreditCardMinor,
// } from '@shopify/polaris-icons';
export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const shop = searchParams.get('shop');
  
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const [userMenuActive, setUserMenuActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);
  const [modalActive, setModalActive] = useState(false);
  const [nameFieldValue, setNameFieldValue] = useState('Ring a Roses App');
  const [emailFieldValue, setEmailFieldValue] = useState('admin@ringaroses.com');
  const [storeName, setStoreName] = useState('Ring a Roses Store');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Fetch orders count for sidebar
  useEffect(() => {
    const fetchOrdersCount = async () => {
      if (!shop) return;
      
      try {
        const backendUrl = "https://e43e420e9e45.ngrok-free.app";
        const response = await fetch(`${backendUrl}/api/profit-analyser/analytics/dashboard?shop=${shop}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setOrdersCount(data.data?.summary?.totalOrders || 0);
        }
      } catch (error) {
        console.error('Error fetching orders count for sidebar:', error);
        setOrdersCount(0);
      }
    };

    fetchOrdersCount();
  }, [shop]);

  const handleSearchResultsDismiss = () => {
    setSearchActive(false);
    setSearchValue('');
  };

  const handleSearchFieldChange = (value) => {
    setSearchValue(value);
    setSearchActive(value.length > 0);
  };

  const handleNavigationToggle = () => {
    setMobileNavigationActive(!mobileNavigationActive);
  };

  const handleContextualSaveBarDiscard = () => {
    setIsDirty(false);
  };

  const handleContextualSaveBarSave = () => {
    setIsDirty(false);
  };

  const navigateWithShop = (path) => {
    const url = shop ? `${path}?shop=${shop}` : path;
    navigate(url);
  };

  const handleNavClick = (path) => () => {
    navigateWithShop(path);
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      const result = await logout(shop);

      if (result.success) {
        setToastMessage('Logged out successfully');
        setToastError(false);
        setToastActive(true);
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          redirectToLogin();
        }, 1000);
      } else {
        throw new Error(result.error || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setToastMessage('Failed to logout. Please try again.');
      setToastError(true);
      setToastActive(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToShopify = () => {
    if (shop) {
      window.open(`https://${shop}/admin`, '_blank');
    }
  };

  const logo = {
    width: 124,
    topBarSource: '/logo.svg',
    contextualSaveBarSource: '/logo.svg',
    url: '/',
    accessibilityLabel: 'Ring a Roses App',
  };

  const userMenuMarkup = (
    <TopBar.UserMenu
      actions={[
        {
          items: [
            { 
              content: '🔙 Back to Shopify',
              onAction: handleBackToShopify
            }
          ],
        },
        {
          items: [
            { content: 'Community forums' },
            { content: 'Help & Support' }
          ],
        },
        {
          items: [
            { 
              content: '🚪 Logout',
              onAction: handleLogout,
              destructive: true
            }
          ],
        },
      ]}
      name="Ring a Roses"
      detail={shop || storeName}
      initials={(shop || storeName).split(' ').map(name => name[0]).join('').toUpperCase()}
      open={userMenuActive}
      onToggle={setUserMenuActive}
    />
  );

  const searchResultsMarkup = (
    <div style={{ height: '200px' }}>
      <div style={{ padding: '16px' }}>
        <p>Search results would appear here</p>
      </div>
    </div>
  );

  const searchFieldMarkup = (
    <TopBar.SearchField
      onChange={handleSearchFieldChange}
      value={searchValue}
      placeholder="Search"
      showFocusBorder
    />
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      userMenu={userMenuMarkup}
      searchResultsVisible={searchActive}
      searchField={searchFieldMarkup}
      searchResults={searchResultsMarkup}
      onSearchResultsDismiss={handleSearchResultsDismiss}
      onNavigationToggle={handleNavigationToggle}
    />
  );

  const navigationMarkup = (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={[
          {
            label: '🏠 Home',
            onClick: handleNavClick('/home'),
            selected: location.pathname === '/home',
          },
          {
            label: '📋 Orders',
            badge: ordersCount > 0 ? ordersCount.toString() : undefined,
            onClick: handleNavClick('/orders'),
            selected: location.pathname === '/orders',
          },
          {
            label: '📦 Products',
            onClick: handleNavClick('/products'),
            selected: location.pathname === '/products',
          },
          {
            label: '👥 Customers',
            onClick: handleNavClick('/customers'),
            selected: location.pathname === '/customers',
          },
        ]}
      />
      <Navigation.Section
        title="Sales channels"
        items={[
          {
            label: '📊 Analytics',
            onClick: handleNavClick('/analytics'),
            selected: location.pathname === '/analytics',
          },
          {
            label: '📢 Marketing',
            onClick: handleNavClick('/marketing'),
            selected: location.pathname === '/marketing',
          },
          {
            label: '🏷️ Discounts',
            onClick: handleNavClick('/discounts'),
            selected: location.pathname === '/discounts',
          },
        ]}
      />
      <Navigation.Section
        title="Apps"
        items={[
          {
            label: '💳 Billing & Plans',
            onClick: handleNavClick('/billing'),
            selected: location.pathname === '/billing',
          },
          {
            label: '🔧 Apps',
            onClick: handleNavClick('/apps'),
            selected: location.pathname === '/apps',
          },
        ]}
      />
      <Navigation.Section
        title="Settings"
        items={[
          {
            label: '⚙️ Settings',
            onClick: handleNavClick('/settings'),
            selected: location.pathname === '/settings',
          },
        ]}
      />
    </Navigation>
  );

  const contextualSaveBarMarkup = isDirty ? (
    <ContextualSaveBar
      message="Unsaved changes"
      saveAction={{
        onAction: handleContextualSaveBarSave,
      }}
      discardAction={{
        onAction: handleContextualSaveBarDiscard,
      }}
    />
  ) : null;

  const loadingMarkup = isLoading ? <Loading /> : null;

  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  const actualPageMarkup = (
    <Frame
      logo={logo}
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={handleNavigationToggle}
      skipToContentTarget="main-content"
    >
      {contextualSaveBarMarkup}
      {loadingMarkup}
      {toastMarkup}
      <div id="main-content">
        {children}
      </div>
    </Frame>
  );

  return actualPageMarkup;
}
