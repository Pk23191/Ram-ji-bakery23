import { motion } from "framer-motion";
import Link from "next/link";
import { Star } from "lucide-react";
import ProductImage from "./ProductImage";
import { useShop } from "../context/ShopContext";
import { categoryLabels } from "../data/site";
import { formatCurrency } from "../utils/helpers";

export default function ProductCard({ product }) {
  const { addToCart } = useShop();
  const showPartyDetails = ["party", "balloons", "ribbons", "candles", "hats", "banners"].includes(product.category);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-[28px] border border-white/60 bg-white/80 shadow-soft"
    >
      <div className="relative h-64 overflow-hidden">
        <ProductImage
          src={product.images?.[0] || product.image}
          alt={product.name}
          fill
          loading="lazy"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-caramel">
          {product.badge}
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-mocha/45">
              {categoryLabels[product.category] || product.category}
            </p>
            <h3 className="mt-1 font-heading text-2xl text-cocoa">{product.name}</h3>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-latte/50 px-3 py-1 text-sm font-semibold text-cocoa">
            <Star size={14} fill="currentColor" />
            {product.rating}
          </div>
        </div>
        <p className="text-sm leading-6 text-mocha/70">{product.description}</p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-cocoa">{formatCurrency(product.finalPrice ?? product.price)}</p>
            {product.originalPrice > (product.finalPrice ?? product.price) ? (
              <p className="text-xs text-mocha/50 line-through">{formatCurrency(product.originalPrice)}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            {showPartyDetails ? (
              <Link href={`/party/${product._id}`} className="btn-secondary px-4 py-2">
                View details
              </Link>
            ) : null}
            <button className="btn-primary px-4 py-2" onClick={() => addToCart(product)}>
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
