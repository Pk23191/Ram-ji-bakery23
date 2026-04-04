import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminGuard from "../../components/AdminGuard";
import Seo from "../../components/Seo";
import Sidebar from "../../components/admin/Sidebar";
import SectionHeader from "../../components/SectionHeader";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/helpers";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Unable to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <AdminGuard>
      <Seo title="Orders - Admin" path="/admin/orders" />
      <section className="section-shell py-12">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside>
            <Sidebar />
          </aside>
          <main>
            <SectionHeader eyebrow="Orders" title="All orders" description="Review recent orders and statuses." />

            <div className="mt-6 rounded-lg border bg-white/85 p-4">
              <div className="w-full overflow-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-left text-xs text-mocha/60">
                      <th className="p-3">Order ID</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.orderId || o._id} className="border-t">
                        <td className="p-3 align-top">{o.orderId || o._id}</td>
                        <td className="p-3 align-top">{o.customerName || o.user?.name || o.email || o.userEmail || "-"}</td>
                        <td className="p-3 align-top">{formatCurrency(Number(o.total ?? o.totalPrice ?? o.amount) || 0)}</td>
                        <td className="p-3 align-top">{o.status || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </section>
    </AdminGuard>
  );
}
