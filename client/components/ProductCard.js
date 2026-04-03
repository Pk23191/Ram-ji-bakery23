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
          const getImageUrl = (img) => {
            if (!img) return "/placeholder.svg";
            if (/^https?:\/\//i.test(img)) return img;
            // remove trailing /api if present in NEXT_PUBLIC_API_URL
            const configured = (api && api.defaults && api.defaults.baseURL) || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const apiRoot = String(configured).replace(/\/api\/?$/, "").replace(/\/$/, "");
            return `${apiRoot}${img.startsWith("/") ? img : `/${img}`}`;
          };

          const src = getImageUrl(product.image);
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