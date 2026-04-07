import { SpeedInsights } from "@vercel/speed-insights/next";
import Layout from "../components/Layout";
import { ShopProvider } from "../context/ShopContext";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <ShopProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <SpeedInsights />
    </ShopProvider>
  );
}
