import { motion } from "framer-motion";
import Link from "next/link";
import { useShop } from "../context/ShopContext";
import { formatCurrency } from "../utils/helpers";
import api from "../utils/api";

export default function ProductCard({ product }) {
  const { addToCart } = useShop();

  const showPartyDetails = ["party", "balloons", "ribbons", "candles", "hats", "banners"].includes(product.category);

  return (
    <motion.div className="rounded-xl border p-4 bg-white">

      {/* IMAGE */}
      {
        (() => {
          const raw = String(product.image || "").trim();
          // Consider values like 'http://..', '//..' and also host:port without protocol
          const hasProtocol = /^https?:\/\//i.test(raw);
          const hasProtocolRelative = /^\/\//.test(raw);
          const looksLikeHostPort = /^(localhost|127\.0\.0\.1|[a-z0-9.-]+:\d+)/i.test(raw);
          const isAbsolute = hasProtocol || hasProtocolRelative || looksLikeHostPort;

          // Prefer the configured axios baseURL so deployed sites don't default to localhost.
          const configuredBase = (api && api.defaults && api.defaults.baseURL) || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
          const apiRoot = String(configuredBase).replace(/\/api\/?$/, "").replace(/\/$/, "");

          let src;
          if (hasProtocolRelative) {
            const proto = (typeof window !== "undefined" && window.location && window.location.protocol) ? window.location.protocol : "http:";
            src = `${proto}${raw}`;
          } else if (hasProtocol) {
            const proto = (typeof window !== "undefined" && window.location && window.location.protocol) ? window.location.protocol : "http:";
            if (/^http:\/\//i.test(raw) && proto === "https:") {
              src = raw.replace(/^http:\/\//i, "https://");
            } else {
              src = raw;
            }
          } else if (looksLikeHostPort) {
            const proto = (typeof window !== "undefined" && window.location && window.location.protocol) ? window.location.protocol : "http:";
            src = `${proto}//${raw.replace(/^\/+/, "")}`;
          } else {
            src = `${apiRoot}/${raw.replace(/^\/+/, "")}`;
          }

          return <img src={src} alt={product.name} style={{ width: "100%", height: "200px", objectFit: "cover" }} />;
        })()
      }

      {/* TITLE */}
      <h2 style={{ marginTop: "10px" }}>{product.name}</h2>

      {/* PRICE */}
      <p>{formatCurrency(product.price)}</p>

      {/* BUTTON SECTION */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "10px",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >

        {/* VIEW DETAILS */}
        {showPartyDetails && (
          <Link href={`/party/${product.id || product._id}`} style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "8px 14px",
                backgroundColor: "#f3f4f6",
                color: "#333",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              View Details
            </button>
          </Link>
        )}

        {/* ADD TO CART */}
        <button
          onClick={() => addToCart(product)}
          style={{
            padding: "8px 14px",
            backgroundColor: "#ff7a18",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Add to Cart
        </button>

      </div>

    </motion.div>
  );
}