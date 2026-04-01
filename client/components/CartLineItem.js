import { Minus, Plus, Trash2 } from "lucide-react";
import ProductImage from "./ProductImage";
import { categoryLabels, normalizeCategory } from "../data/site";
import { formatCurrency, getUnitPrice } from "../utils/helpers";
import { useShop } from "../context/ShopContext";

export default function CartLineItem({ item }) {
  const { updateQuantity, removeFromCart } = useShop();
  const customizationSummary = item.customizations
    ? Object.entries(item.customizations)
        .filter(([key, value]) => Boolean(value) && key !== "imagePreview")
        .map(([, value]) => value)
        .join(", ")
    : "";

  const unitPrice = getUnitPrice(item);
  const originalPrice = Number(item.originalPrice ?? item.price ?? unitPrice);

  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-[22px] bg-latte/30">
          <ProductImage
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-caramel">
            {categoryLabels[normalizeCategory(item.category)] || item.category}
          </p>
          <h3 className="mt-1 font-heading text-2xl text-cocoa">{item.name}</h3>
          {customizationSummary ? (
            <p className="mt-2 text-sm text-mocha/65">{customizationSummary}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-caramel/30 bg-latte/30">
          <button className="p-3 text-cocoa" onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}>
            <Minus size={16} />
          </button>
          <span className="min-w-10 text-center text-sm font-semibold">{item.quantity}</span>
          <button className="p-3 text-cocoa" onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>
            <Plus size={16} />
          </button>
        </div>
        <div className="min-w-24 text-right">
          <p className="font-semibold text-cocoa">{formatCurrency(unitPrice * item.quantity)}</p>
          {originalPrice > unitPrice ? (
            <p className="text-xs text-mocha/50 line-through">{formatCurrency(originalPrice * item.quantity)}</p>
          ) : null}
        </div>
        <button
          className="rounded-full border border-rose/30 p-3 text-rose-600"
          onClick={() => removeFromCart(item.cartItemId)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
