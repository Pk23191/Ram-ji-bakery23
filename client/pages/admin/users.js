import { useEffect } from "react";
import { useRouter } from "next/router";
import AdminGuard from "../../components/AdminGuard";
import Seo from "../../components/Seo";

export default function AdminUsersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?section=users");
  }, [router]);

  return (
    <AdminGuard>
      <Seo title="Users - Admin" path="/admin/users" />
      <section className="section-shell py-16 text-center text-sm text-mocha/70">
        Redirecting to the admin dashboard...
      </section>
    </AdminGuard>
  );
}
