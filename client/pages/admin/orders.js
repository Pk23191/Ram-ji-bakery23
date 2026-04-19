import { useEffect } from "react";
import { useRouter } from "next/router";
import AdminGuard from "../../components/AdminGuard";
import Seo from "../../components/Seo";

export default function AdminOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?section=orders");
  }, [router]);

  return (
    <AdminGuard>
      <Seo title="Orders - Admin" path="/admin/orders" />
      <section className="section-shell py-16 text-center text-sm text-mocha/70">
        Redirecting to the admin dashboard...
      </section>
    </AdminGuard>
  );
}
