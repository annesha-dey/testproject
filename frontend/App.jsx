import { BrowserRouter, useLocation } from "react-router-dom";
import Routes from "./Routes";
import AppLayout from "./components/Layout/AppLayout";
import AuthGuard from "./components/Auth/AuthGuard";
import "./assets/shopify-theme.css";

import {
  QueryProvider,
  PolarisProvider,
} from "./components";

function AppContent() {
  const location = useLocation();
  const pages = import.meta.glob("./pages/**/!(*.test.[jt]sx)*.([jt]sx)", { eager: true });
  
  // Routes that should not have the AppLayout (sidebar/navigation)
  const noLayoutRoutes = ['/login', '/exitiframe'];
  const shouldShowLayout = !noLayoutRoutes.includes(location.pathname);

  if (shouldShowLayout) {
    return (
      <AuthGuard>
        <AppLayout>
          <Routes pages={pages} />
        </AppLayout>
      </AuthGuard>
    );
  }

  // For login page, render without layout and without auth guard
  return <Routes pages={pages} />;
}

export default function App() {
  return (
    <PolarisProvider>
      <BrowserRouter>
        <QueryProvider>
          <AppContent />
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
