import { motion } from "framer-motion";
import Link from "next/link";
import { useShop } from "../context/ShopContext";
import { formatCurrency } from "../utils/helpers";
import api from "../utils/api";
import ProductImage from "./ProductImage";

export default function ProductCard({ product }) {
  const { addToCart } = useShop();

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("Product Image:", product?.image);
  }

  const showPartyDetails = ["party", "balloons", "ribbons", "candles", "hats", "banners"].includes(product.category);

  return (
    <motion.div className="bg-white rounded-2xl shadow-md p-3 md:rounded-xl md:shadow-none md:p-4">
      {/* Mobile-first card: image on top */}
      <div className="w-full overflow-hidden rounded-xl">
        <div className="relative w-full aspect-[1/1] md:aspect-[4/3]">
          <ProductImage src={product.image} alt={product.name} fill className="object-contain" />
        </div>
      </div>

      <h2 className="mt-2 text-base font-semibold text-cocoa md:mt-3">{product.name}</h2>

      <p className="text-orange-500 font-bold mt-1 md:mt-2">{formatCurrency(product.price)}</p>

      <div className="mt-3 md:mt-4">
        <button
          onClick={() => addToCart(product)}
          className="w-full bg-orange-500 text-white py-2 rounded-xl font-semibold md:inline-block md:w-auto md:px-4"
        >
          Add to Cart
        </button>
      </div>

      {showPartyDetails && (
        <div className="mt-2 md:mt-3">
          <Link href={`/party/${product.id || product._id}`} className="text-sm text-mocha/70 hover:text-cocoa">
            View Details
          </Link>
        </div>
      )}
    </motion.div>
  );
}