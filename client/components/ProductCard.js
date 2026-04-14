import { motion } from "framer-motion";
import Link from "next/link";
import { useShop } from "../context/ShopContext";
import { formatCurrency } from "../utils/helpers";
import ProductImage from "./ProductImage";
import { Star } from "lucide-react";

export default function ProductCard({ product }) {
  const { addToCart } = useShop();

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("Product Image:", product?.image);
  }

  const showPartyDetails = ["party", "balloons", "ribbons", "candles", "hats", "banners"].includes(product.category);
  const hasDiscount = product.discountPercent && product.discountPercent > 0;
  const discountedPrice = hasDiscount ? Math.round(product.price * (1 - product.discountPercent / 100)) : null;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="flex flex-col h-full bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-3 md:rounded-2xl md:shadow-md md:p-4 overflow-hidden"
    >
      {/* Image Container */}
      <div className="w-full overflow-hidden rounded-xl relative group bg-latte/10">
        <div className="relative w-full aspect-square">
          <ProductImage 
            src={product.image} 
            alt={product.name} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={false}
          />
        </div>
        
        {/* Badge */}
        {hasDiscount && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 p-1.5 rounded-full text-xs font-bold">
            -{product.discountPercent}%
          </div>
        )}
        
        {product.badge && !hasDiscount && (
          <div className="absolute top-3 right-3 bg-caramel text-white px-3 p-1.5 rounded-full text-xs font-semibold">
            {product.badge}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col mt-3 md:mt-4">
        <h2 className="text-sm font-semibold text-cocoa line-clamp-2 min-h-[2.5rem] md:text-base leading-tight">
          {product.name}
        </h2>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={i < Math.floor(product.rating) ? "fill-caramel text-caramel" : "text-latte"}
                />
              ))}
            </div>
            <span className="text-xs text-mocha/60">({product.rating || 4.7})</span>
          </div>
        )}

        {/* Price */}
        <div className="mt-2 md:mt-3">
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-cocoa">{formatCurrency(discountedPrice)}</span>
              <span className="text-sm text-mocha/50 line-through">{formatCurrency(product.price)}</span>
            </div>
          ) : (
            <p className="text-caramel font-bold text-lg">{formatCurrency(product.price)}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-4 flex flex-col gap-2">
        <button
          onClick={() => addToCart(product)}
          className="w-full bg-cocoa text-cream py-2.5 rounded-xl font-semibold text-sm transition-all hover:bg-mocha hover:shadow-md active:scale-95 duration-200"
        >
          Add to Cart
        </button>

        {showPartyDetails && (
          <Link 
            href={`/party/${product.id || product._id}`} 
            className="w-full bg-latte/50 text-cocoa py-2 rounded-xl font-semibold text-sm transition hover:bg-latte text-center"
          >
            View Details
          </Link>
        )}
      </div>
    </motion.div>
  );
}