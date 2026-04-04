import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminGuard from "../../components/AdminGuard";
import Seo from "../../components/Seo";
import Sidebar from "../../components/admin/Sidebar";
import SectionHeader from "../../components/SectionHeader";
import ProductTable from "../../components/admin/ProductTable";
import api from "../../utils/api";

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Unable to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleEdit = (product) => {
    // Reuse the existing admin index edit form by navigating with query param
    router.push({ pathname: "/admin", query: { edit: product._id } });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      setDeletingId(id);
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      await loadProducts();
    } catch (err) {
      toast.error("Unable to delete product");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <AdminGuard>
      <Seo title="Products - Admin" path="/admin/products" />
      <section className="section-shell py-12">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside>
            <Sidebar />
          </aside>
          <main>
            <SectionHeader eyebrow="Products" title="Manage products" description="View, edit or delete products." />

            <div className="mt-6">
              <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} deletingId={deletingId} />
            </div>
          </main>
        </div>
      </section>
    </AdminGuard>
  );
}
