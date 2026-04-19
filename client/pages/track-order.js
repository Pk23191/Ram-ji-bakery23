import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Seo from "../components/Seo";
import SectionHeader from "../components/SectionHeader";
import { useShop } from "../context/ShopContext";
import api from "../utils/api";
import { canCancelOrder, formatCurrency, getOrderStatusColor } from "../utils/helpers";

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [matchingOrder, setMatchingOrder] = useState(null);
  const { orders, updateOrderInState, customerSession } = useShop();

  const getCustomerHeaders = () =>
    customerSession?.token
      ? {
          headers: {
            Authorization: `Bearer ${customerSession.token}`
          }
        }
      : {};

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setMatchingOrder(null);
      return;
    }

    let active = true;

    async function loadOrder() {
      if (!customerSession?.token) {
        const localMatch = orders.find((order) => order.id.toLowerCase() === trimmed.toLowerCase());
        setMatchingOrder(localMatch || null);
        return;
      }

      try {
        setIsLoading(true);
        const { data } = await api.get("/orders", {
          params: { orderId: trimmed },
          ...getCustomerHeaders()
        });
        if (!active) return;
        setMatchingOrder(Array.isArray(data) ? data[0] || null : null);
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || "Unable to load order");
          setMatchingOrder(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadOrder();

    return () => {
      active = false;
    };
  }, [query, customerSession?.token, orders]);

  const handleCancel = async () => {
    if (!matchingOrder || !cancelReason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }

    try {
      setIsCancelling(true);
      const orderId = matchingOrder.orderId || matchingOrder.id;
      const { data } = await api.patch(`/order/${orderId}/cancel`, {
        reason: cancelReason,
        cancelledBy: "customer"
      });
      updateOrderInState(data.order);
      toast.success("Order cancelled successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to cancel this order");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Seo title="Track Order" description="Track your bakery order status in real time." path="/track-order" />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="Track order"
          title="Simple post-purchase status visibility"
          description="Enter your order ID to view preparation and delivery status."
        />
        <div className="glass-panel mt-10 mx-auto max-w-3xl p-6">
          <input
            className="soft-input"
            placeholder="Enter order ID like RB1024"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-mocha/70">
              <LoaderCircle size={16} className="animate-spin" />
              Loading order...
            </div>
          ) : matchingOrder ? (
            <div className="mt-6 rounded-[28px] bg-latte/30 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-caramel">Order ID</p>
                  <p className="mt-1 font-heading text-3xl text-cocoa">{matchingOrder.orderId || matchingOrder.id}</p>
                </div>
                <span className={`rounded-full px-4 py-2 text-sm font-semibold ${getOrderStatusColor(matchingOrder.status)}`}>
                  {matchingOrder.status}
                </span>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-mocha/70 sm:grid-cols-3">
                <p>Customer: {matchingOrder.customer}</p>
                <p>Total: {formatCurrency(matchingOrder.total)}</p>
                <p>Date: {matchingOrder.createdAt}</p>
              </div>
              {matchingOrder.cancelReason ? (
                <div className="mt-4 rounded-[22px] bg-rose-50 p-4 text-sm text-rose-700">
                  Cancel reason: {matchingOrder.cancelReason}
                </div>
              ) : null}
              {canCancelOrder(matchingOrder.status) ? (
                <div className="mt-5 space-y-3">
                  <textarea
                    rows="3"
                    className="soft-input"
                    placeholder="Reason for cancellation"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <button className="btn-secondary" onClick={handleCancel} disabled={isCancelling}>
                    {isCancelling ? (
                      <span className="inline-flex items-center gap-2">
                        <LoaderCircle size={16} className="animate-spin" />
                        Cancelling...
                      </span>
                    ) : (
                      "Cancel Order"
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          ) : query ? (
            <p className="mt-4 text-sm text-rose-600">No order found for that ID yet.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
