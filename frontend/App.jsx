import { BrowserRouter } from "react-router-dom";
import Routes from "./Routes";
import AppLayout from "./components/Layout/AppLayout";
import "./assets/shopify-theme.css";

import {
  QueryProvider,
  PolarisProvider,
} from "./components";

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.glob("./pages/**/!(*.test.[jt]sx)*.([jt]sx)", { eager: true });

  return (
    <PolarisProvider>
      <BrowserRouter>
        <QueryProvider>
          <AppLayout>
            <Routes pages={pages} />
          </AppLayout>
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
