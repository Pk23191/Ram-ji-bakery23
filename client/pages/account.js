import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Seo from "../components/Seo";
import SectionHeader from "../components/SectionHeader";
import { useShop } from "../context/ShopContext";
import api from "../utils/api";
import { formatCurrency } from "../utils/helpers";

export default function AccountPage() {
  const router = useRouter();
  const { customerSession, setCustomerSession } = useShop();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!customerSession?.token || !customerSession?.email) {
      router.replace("/login");
      return;
    }

    let active = true;

    async function loadAccount() {
      try {
        setIsLoading(true);
        const headers = {
          headers: {
            Authorization: `Bearer ${customerSession.token}`
          }
        };
        const [{ data: profileData }, { data: orderData }] = await Promise.all([
          api.get("/auth/me", headers),
          api.get("/orders", {
            params: { email: customerSession.email },
            ...headers
          })
        ]);

        if (!active) return;
        setProfile(profileData.user);
        setOrders(Array.isArray(orderData) ? orderData : []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load your account");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, [customerSession?.token, customerSession?.email, router]);

  return (
    <>
      <Seo title="My Account" description="View your Ramji Bakery profile and orders." path="/account" />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="My account"
          title="Your bakery profile and orders"
          description="See your saved profile details and recent bakery orders in one place."
        />

        {isLoading ? (
          <div className="glass-panel mt-10 p-8 text-sm text-mocha/70">Loading your account...</div>
        ) : (
          <div className="mt-10 grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="glass-panel p-6">
              <h2 className="font-heading text-3xl text-cocoa">Profile</h2>
              <div className="mt-5 space-y-3 text-sm text-mocha/70">
                <p><span className="font-semibold text-cocoa">Name:</span> {profile?.name || customerSession?.name}</p>
                <p><span className="font-semibold text-cocoa">Email:</span> {profile?.email || customerSession?.email}</p>
                <p><span className="font-semibold text-cocoa">Role:</span> {profile?.role || "customer"}</p>
                <p>
                  <span className="font-semibold text-cocoa">Email status:</span>{" "}
                  {profile?.emailVerified ? "Verified" : "Not verified"}
                </p>
              </div>
              {!profile?.emailVerified ? (
                <button
                  className="btn-primary mt-4"
                  disabled={isResending}
                  onClick={async () => {
                    try {
                      setIsResending(true);
                      await api.post(
                        "/users/verify-email/resend",
                        {},
                        {
                          headers: {
                            Authorization: `Bearer ${customerSession.token}`
                          }
                        }
                      );
                      toast.success("Verification email sent");
                    } catch (error) {
                      toast.error(error.response?.data?.message || "Unable to resend verification email");
                    } finally {
                      setIsResending(false);
                    }
                  }}
                >
                  {isResending ? "Sending..." : "Resend verification email"}
                </button>
              ) : null}
              <button
                className="btn-secondary mt-6"
                onClick={() => {
                  setCustomerSession(null);
                  router.push("/login");
                }}
              >
                Logout
              </button>
            </div>

            <div className="glass-panel p-6">
              <h2 className="font-heading text-3xl text-cocoa">My Orders</h2>
              <div className="mt-6 grid gap-4">
                {orders.length ? (
                  orders.map((order) => (
                    <div key={order.orderId} className="rounded-[24px] border border-white/60 bg-white/80 p-4">
                      <p className="font-semibold text-cocoa">{order.orderId}</p>
                      <p className="mt-1 text-sm text-mocha/65">{order.status}</p>
                      <p className="mt-1 text-sm text-mocha/65">{formatCurrency(order.total)}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] bg-latte/30 p-6 text-center text-sm text-mocha/70">
                    No orders found for this account yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
