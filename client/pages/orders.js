import { BadgeCheck, Ban, LoaderCircle, LogOut, MapPinned, Package, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Seo from "../components/Seo";
import SectionHeader from "../components/SectionHeader";
import { useShop } from "../context/ShopContext";
import api from "../utils/api";
import {
  canCancelOrder,
  formatCurrency,
  getOrderStatusColor,
  getOrderTrackingMessage,
  getStatusStepState,
  getTrackableStatuses
} from "../utils/helpers";

const statusIconMap = {
  Pending: Package,
  Confirmed: BadgeCheck,
  Preparing: Package,
  "Out for Delivery": Truck,
  Delivered: BadgeCheck,
  Cancelled: Ban
};

export default function OrdersPage() {
  const { customerSession, setCustomerSession } = useShop();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginForm, setLoginForm] = useState({
    name: customerSession?.name || "",
    phone: customerSession?.phone || ""
  });
  const [cancelState, setCancelState] = useState({ orderId: "", reason: "", loading: false });

  const getCustomerHeaders = () =>
    customerSession?.token
      ? {
          headers: {
            Authorization: `Bearer ${customerSession.token}`
          }
        }
      : {};

  const loadOrders = async (phone = customerSession?.phone, email = customerSession?.email) => {
    if (!phone && !email) {
      return;
    }

    try {
      setIsLoading(true);
      const { data } = await api.get("/orders", {
        params: {
          ...(phone ? { phone } : {}),
          ...(email ? { email } : {})
        },
        ...getCustomerHeaders()
      });
      setOrders(data);
    } catch (error) {
      toast.error("Unable to fetch your orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customerSession?.phone || customerSession?.email) {
      loadOrders(customerSession.phone, customerSession.email);
    }
  }, [customerSession?.phone, customerSession?.email]);

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setIsLoggingIn(true);
      const { data } = await api.post("/auth/customer-login", loginForm);
      setCustomerSession({
        ...data.customer,
        token: data.token
      });
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCancel = async (orderId) => {
    const reason = cancelState.orderId === orderId ? cancelState.reason.trim() : "";

    if (!reason) {
      toast.error("Please enter a cancel reason");
      return;
    }

    try {
      setCancelState((prev) => ({ ...prev, loading: true }));
      await api.put(
        `/orders/${orderId}/cancel`,
        {
          reason,
          cancelledBy: "customer"
        },
        getCustomerHeaders()
      );
      toast.success("Order cancelled successfully");
      setCancelState({ orderId: "", reason: "", loading: false });
      await loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to cancel order");
      setCancelState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      <Seo title="Orders" description="View and manage bakery orders at Ramji Bakery." path="/orders" />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="Your orders"
          title="Track every bakery order like a food delivery app"
          description="Login with the same name and phone used during checkout to see your personal order timeline."
        />

        {!customerSession ? (
          <form onSubmit={handleLogin} className="glass-panel mx-auto mt-10 max-w-xl space-y-4 p-6 sm:p-8">
            <div>
              <p className="text-sm font-semibold text-cocoa">Customer Login</p>
              <p className="mt-1 text-sm text-mocha/70">Use your checkout details to open your order history.</p>
            </div>
            <input
              className="soft-input"
              placeholder="Your name"
              value={loginForm.name}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              className="soft-input"
              placeholder="Phone number"
              value={loginForm.phone}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <button className="btn-primary w-full" disabled={isLoggingIn}>
              {isLoggingIn ? "Signing in..." : "View My Orders"}
            </button>
          </form>
        ) : (
          <div className="mt-10 space-y-6">
            <div className="glass-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-cocoa">{customerSession.name}</p>
                <p className="text-sm text-mocha/70">{customerSession.phone}</p>
              </div>
              <button
                className="btn-secondary"
                onClick={() => {
                  setCustomerSession(null);
                  setOrders([]);
                }}
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>

            {isLoading ? (
              <div className="glass-panel flex min-h-64 items-center justify-center">
                <LoaderCircle size={28} className="animate-spin text-caramel" />
              </div>
            ) : orders.length ? (
              <div className="grid gap-5">
                {orders.map((order) => {
                  const CurrentStatusIcon = statusIconMap[order.status] || Package;

                  return (
                    <div key={order.orderId} className="glass-panel overflow-hidden p-5 sm:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-caramel">Order ID</p>
                            <h2 className="font-heading text-3xl text-cocoa">{order.orderId}</h2>
                          </div>
                          <div className="grid gap-2 text-sm text-mocha/70 sm:grid-cols-3">
                            <p>Total: {formatCurrency(order.total)}</p>
                            <p>Payment: {order.paymentMethod}</p>
                            <p>Date: {(order.orderTime || order.createdAt || "").toString().slice(0, 10) || "Today"}</p>
                          </div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-latte/40 px-4 py-2 text-sm text-mocha/75">
                            <MapPinned size={15} />
                            {order.address}
                          </div>
                        </div>

                        <div className="space-y-3 lg:max-w-sm">
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${getOrderStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-caramel shadow-soft">
                              <CurrentStatusIcon size={18} />
                            </div>
                          </div>
                          <p className="text-sm leading-6 text-mocha/70">{getOrderTrackingMessage(order.status)}</p>
                        </div>
                      </div>

                      <div className="mt-6 rounded-[28px] bg-white/70 p-4 shadow-soft">
                        <div className="flex flex-wrap items-center gap-3">
                          {getTrackableStatuses(order.status).map((step) => {
                            const stepState = getStatusStepState(order.status, step);

                            return (
                              <div key={`${order.orderId}-${step}`} className="flex items-center gap-3">
                                <div
                                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                                    stepState === "complete"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : stepState === "current"
                                        ? getOrderStatusColor(order.status)
                                        : "bg-stone-100 text-stone-500"
                                  }`}
                                >
                                  {step}
                                </div>
                                {step !== getTrackableStatuses(order.status).at(-1) ? (
                                  <div className="h-px w-5 bg-caramel/30 sm:w-8" />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-5 rounded-[28px] bg-latte/25 p-4">
                        <p className="text-sm font-semibold text-cocoa">Items in this order</p>
                        <div className="mt-4 grid gap-4">
                          {order.items?.map((item, index) => (
                            <div
                              key={`${order.orderId}-${index}`}
                              className="flex flex-col gap-4 rounded-[22px] bg-white/85 p-4 shadow-soft sm:flex-row sm:items-center"
                            >
                              <img
                                src={item.image || "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=500&q=80"}
                                alt={item.name}
                                className="h-24 w-full rounded-[18px] object-cover sm:w-24"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-cocoa">{item.name}</p>
                                <p className="mt-1 text-sm text-mocha/65">
                                  Qty {item.quantity} | {formatCurrency(item.price)}
                                </p>
                                {item.customizations ? (
                                  <p className="mt-2 text-sm text-mocha/60">
                                    Custom cake: {Object.values(item.customizations).filter(Boolean).join(" | ")}
                                  </p>
                                ) : null}
                              </div>
                              <p className="text-sm font-semibold text-cocoa">
                                {formatCurrency((item.price || 0) * (item.quantity || 0))}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.status === "Cancelled" && order.cancelReason ? (
                        <div className="mt-4 rounded-[22px] bg-rose-50 p-4 text-sm text-rose-700">
                          Cancel reason: {order.cancelReason}
                        </div>
                      ) : null}

                      {canCancelOrder(order.status) ? (
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <textarea
                            rows="3"
                            className="soft-input"
                            placeholder="Tell us why you want to cancel"
                            value={cancelState.orderId === order.orderId ? cancelState.reason : ""}
                            onChange={(event) =>
                              setCancelState({
                                orderId: order.orderId,
                                reason: event.target.value,
                                loading: false
                              })
                            }
                          />
                          <button
                            className="btn-secondary h-fit"
                            onClick={() => handleCancel(order.orderId)}
                            disabled={cancelState.loading && cancelState.orderId === order.orderId}
                          >
                            {cancelState.loading && cancelState.orderId === order.orderId ? "Cancelling..." : "Cancel Order"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-panel p-8 text-center text-sm text-mocha/70">
                No orders found for this phone number yet.
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
