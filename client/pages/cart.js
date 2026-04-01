import Link from "next/link";
import CartLineItem from "../components/CartLineItem";
import Seo from "../components/Seo";
import SectionHeader from "../components/SectionHeader";
import { useShop } from "../context/ShopContext";
import { formatCurrency } from "../utils/helpers";
import { calculatePricingSummary } from "../utils/pricing";
import api from "../utils/api";
import { useState } from "react";
import toast from "react-hot-toast";

export default function CartPage() {
  const { cart, cartTotal, coupon, setCoupon } = useShop();
  const pricing = calculatePricingSummary(cartTotal, coupon?.discountPercent || 0);
  const [couponCode, setCouponCode] = useState(coupon?.code || "");
  const [isApplying, setIsApplying] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      setIsApplying(true);
      const { data } = await api.post("/coupons/apply", {
        code: couponCode.trim(),
        subtotal: pricing.subtotal
      });
      setCoupon({
        code: data.code,
        discountPercent: data.discountPercent,
        discountAmount: data.discountAmount
      });
      toast.success(`Coupon ${data.code} applied`);
    } catch (error) {
      setCoupon(null);
      toast.error(error.response?.data?.message || "Invalid coupon");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <Seo title="Cart" description="Review your cart and proceed to checkout at Ramji Bakery." path="/cart" />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="Cart"
          title="Ready for checkout"
          description="Review items, adjust quantities and move to payment."
        />
        <div className="mt-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            {cart.length ? (
              cart.map((item) => <CartLineItem key={item.cartItemId} item={item} />)
            ) : (
              <div className="glass-panel p-8 text-center">
                <p className="text-lg font-semibold text-cocoa">Your cart is empty</p>
                <p className="mt-2 text-sm text-mocha/70">Add cakes, pastries or a custom celebration order to continue.</p>
                <Link href="/menu" className="btn-primary mt-5">
                  Explore Menu
                </Link>
              </div>
            )}
          </div>
          <div className="glass-panel h-fit p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-caramel">Summary</p>
            <div className="mt-5 space-y-4 text-sm text-mocha/70">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(pricing.subtotal)}</span>
              </div>
              {pricing.discountAmount ? (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Coupon ({coupon?.code || "Applied"})</span>
                  <span>-{formatCurrency(pricing.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-emerald-700">Free Delivery</span>
              </div>
              <div className="flex items-center justify-between border-t border-caramel/15 pt-4 text-base font-semibold text-cocoa">
                <span>Total</span>
                <span>{formatCurrency(pricing.total)}</span>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-caramel">Have a coupon?</p>
              <div className="flex gap-2">
                <input
                  className="soft-input"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                />
                <button className="btn-secondary" type="button" onClick={applyCoupon} disabled={isApplying}>
                  {isApplying ? "Applying..." : "Apply"}
                </button>
              </div>
              {coupon ? (
                <button
                  className="text-xs font-semibold text-rose-600"
                  type="button"
                  onClick={() => {
                    setCoupon(null);
                    setCouponCode("");
                  }}
                >
                  Remove coupon
                </button>
              ) : null}
            </div>
            <Link href="/checkout" className="btn-primary mt-6 w-full">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
