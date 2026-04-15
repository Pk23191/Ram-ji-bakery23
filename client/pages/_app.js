import Layout from "../components/Layout";
import ErrorBoundary from "../components/ErrorBoundary";
import { ShopProvider } from "../context/ShopContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <ShopProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ShopProvider>
      <SpeedInsights />
    </ErrorBoundary>
  );
}
