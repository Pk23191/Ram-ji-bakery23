import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import Seo from "../components/Seo";
import SectionHeader from "../components/SectionHeader";
import { useShop } from "../context/ShopContext";
import api from "../utils/api";
import { calculatePricingSummary } from "../utils/pricing";
import { formatCurrency } from "../utils/helpers";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, placeOrder, customerSession, setCustomerSession, coupon } = useShop();
  const pricing = calculatePricingSummary(cartTotal, coupon?.discountPercent || 0);
  const [formData, setFormData] = useState({
    name: customerSession?.name || "",
    phone: customerSession?.phone || "",
    address: "",
    paymentMethod: "COD"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: customerSession?.name || prev.name,
      phone: customerSession?.phone || prev.phone
    }));
  }, [customerSession?.name, customerSession?.phone]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!cart.length) {
      toast.error("Your cart is empty");
      return;
    }

    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();

    if (!trimmedName || !trimmedPhone || !trimmedAddress) {
      toast.error("Please complete all checkout details");
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      customer: trimmedName,
      customerEmail: customerSession?.email || "",
      phone: trimmedPhone,
      address: trimmedAddress,
      paymentMethod: formData.paymentMethod,
      status: "Pending",
      orderTime: new Date().toISOString(),
      subtotal: pricing.subtotal,
      discountPercent: coupon?.discountPercent || 0,
      discountAmount: pricing.discountAmount || 0,
      couponCode: coupon?.code || "",
      total: pricing.total,
      behaviorTags: cart.flatMap((item) => [item.category, item.customizations?.flavor].filter(Boolean)),
      total: pricing.total,
      items: cart.map((item) => ({
        productId: item._id,
        name: item.name,
        image: item.image,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        customizations: item.customizations || null
      }))
    };

    try {
      const { data } = await api.post("/order", orderPayload);
      let nextCustomerSession = {
        name: trimmedName,
        phone: trimmedPhone,
        token: customerSession?.token || ""
      };

      try {
        const loginResponse = await api.post("/auth/customer-login", {
          name: trimmedName,
          phone: trimmedPhone
        });

        nextCustomerSession = {
          ...loginResponse.data.customer,
          token: loginResponse.data.token
        };
      } catch (loginError) {
        // Keep checkout successful even if customer-session refresh fails.
      }

      setCustomerSession(nextCustomerSession);
      const placedOrder = placeOrder(data.order);
      const confirmationId = data.order?.orderId || placedOrder.id;

      toast.success("Order placed successfully");
      await router.push(`/order-confirmation?id=${confirmationId}`);

      if (data.whatsappUrl) {
        window.setTimeout(() => {
          const popup = window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
          if (!popup) {
            toast("WhatsApp link is ready. Please allow popups if it did not open.");
          }
        }, 500);
      }
    } catch (error) {
      const message = error.response?.data?.message || "Order failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Checkout" description="Complete your bakery order with COD or UPI." path="/checkout" />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="Checkout"
          title="Delivery details and payment"
          description="Fast, simple checkout optimized for mobile users."
        />
        <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_0.85fr]">
          <form className="glass-panel space-y-5 p-6" onSubmit={handleSubmit}>
            {[
              { key: "name", label: "Full Name", type: "text" },
              { key: "phone", label: "Phone Number", type: "tel" }
            ].map((field) => (
              <label key={field.key} className="block">
                <span className="mb-2 block text-sm font-semibold text-cocoa">{field.label}</span>
                <input
                  required
                  type={field.type}
                  className="soft-input"
                  value={formData[field.key]}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </label>
            ))}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-cocoa">Delivery Address</span>
              <textarea
                required
                rows="4"
                className="soft-input"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </label>
            <div>
              <span className="mb-3 block text-sm font-semibold text-cocoa">Payment Method</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Cash on Delivery", value: "COD" },
                  { label: "UPI (Mock)", value: "UPI" }
                ].map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: option.value }))}
                    className={`rounded-[22px] border px-4 py-4 text-left ${
                      formData.paymentMethod === option.value
                        ? "border-caramel bg-latte/60"
                        : "border-caramel/20 bg-white"
                    }`}
                  >
                    <p className="font-semibold text-cocoa">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <button
              disabled={!cart.length || isSubmitting}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle size={18} className="animate-spin" />
                  Processing Order...
                </span>
              ) : (
                "Place Order"
              )}
            </button>
          </form>
          <div className="glass-panel p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-caramel">Why customers convert</p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-mocha/70">
              <p>Same-day Dinara delivery for selected products.</p>
              <p>UPI-ready checkout flow with COD fallback for maximum convenience.</p>
              <p>Custom cake notes and image references are carried into the order summary.</p>
            </div>
            <div className="mt-6 rounded-[24px] bg-latte/30 p-5">
              <p className="text-sm font-semibold text-cocoa">Order Summary</p>
              <div className="mt-4 space-y-3 text-sm text-mocha/70">
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
                <div className="flex items-center justify-between border-t border-caramel/15 pt-3 font-semibold text-cocoa">
                  <span>Total</span>
                  <span>{formatCurrency(pricing.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
