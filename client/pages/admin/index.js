import Link from "next/link";
import { LoaderCircle, PencilLine, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminGuard from "../../components/AdminGuard";
import Seo from "../../components/Seo";
import SectionHeader from "../../components/SectionHeader";
import { useShop } from "../../context/ShopContext";
import { categoryLabels, normalizeCategory, normalizeProduct, productCategories } from "../../data/site";
import api from "../../utils/api";
import Sidebar from "../../components/admin/Sidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import DashboardCards from "../../components/admin/DashboardCards";
import ProductTable from "../../components/admin/ProductTable";
import {
  canCancelOrder,
  formatCurrency,
  getOrderStatusColor,
  getOrderTrackingMessage,
  ORDER_STATUSES
} from "../../utils/helpers";

const emptyForm = {
  name: "",
  price: "",
  discountPercent: "",
  category: "cake",
  existingImages: [],
  imageUrls: [""],
  selectedFiles: [],
  colors: [{ name: "", image: "" }],
  description: ""
};

export default function AdminDashboardPage() {
  const { adminToken, adminUser, setAdminToken, setAdminUser } = useShop();
  const router = useRouter();
  const sectionOptions = ["dashboard", "products", "orders", "banner", "images", "coupons", "users", "settings"];
  const [activeSection, setActiveSection] = useState("dashboard");
  const [formData, setFormData] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [orders, setOrders] = useState([]);
  const [cancelState, setCancelState] = useState({ orderId: "", reason: "", loading: false });
  const [statusLoadingId, setStatusLoadingId] = useState("");
  const [statusDrafts, setStatusDrafts] = useState({});
  const [dashboard, setDashboard] = useState({
    totalSales: 0,
    todaySales: 0,
    monthlySales: 0,
    totalOrders: 0,
    salesByDay: []
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: "", password: "", role: "admin" });
  const [adminSaving, setAdminSaving] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: "", discountPercent: "" });
  const [couponSaving, setCouponSaving] = useState(false);
  const [selectedFilePreviews, setSelectedFilePreviews] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerTitle, setBannerTitle] = useState("Homepage Banner");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerPreview, setBannerPreview] = useState("");

  const loadDashboard = async () => {
    try {
      setDashboardLoading(true);
      const { data } = await api.get("/dashboard");
      setDashboard((prev) => ({ ...prev, ...data }));
    } catch (error) {
      toast.error("Unable to load dashboard");
    } finally {
      setDashboardLoading(false);
    }
  };
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/products");
      setProducts(Array.isArray(data) ? data.map((product) => normalizeProduct(product)) : []);
    } catch (error) {
      toast.error("Unable to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const { data } = await api.get("/orders");
      setOrders(data);
      setStatusDrafts(Object.fromEntries((Array.isArray(data) ? data : []).map((order) => [order.orderId, order.status])));
      // Compute dashboard metrics from orders locally (safe fallback / enhancement)
      try {
        computeDashboardFromOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        // non-fatal
        console.error("computeDashboardFromOrders error", err);
      }
    } catch (error) {
      toast.error("Unable to load orders");
    }
  };

  const computeDashboardFromOrders = (ordersArray) => {
    const ordersList = Array.isArray(ordersArray) ? ordersArray : [];

    // helper to parse createdAt/orderTime
    const toDate = (o) => {
      const d = new Date(o.createdAt || o.orderTime || o.date || null);
      return isNaN(d.getTime()) ? null : d;
    };

    const isCancelled = (o) => String(o.status || "").toLowerCase() === "cancelled";

    const totalSales = ordersList.reduce((sum, o) => {
      if (isCancelled(o)) return sum;
      const amt = Number(o.total ?? o.totalPrice ?? o.amount ?? 0) || 0;
      return sum + amt;
    }, 0);

    const today = new Date();
    const todayStr = today.toDateString();

    const todaySales = ordersList.reduce((sum, o) => {
      if (isCancelled(o)) return sum;
      const d = toDate(o);
      if (!d) return sum;
      if (d.toDateString() === todayStr) {
        return sum + (Number(o.total ?? o.totalPrice ?? o.amount ?? 0) || 0);
      }
      return sum;
    }, 0);

    const monthlySales = ordersList.reduce((sum, o) => {
      if (isCancelled(o)) return sum;
      const d = toDate(o);
      if (!d) return sum;
      if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
        return sum + (Number(o.total ?? o.totalPrice ?? o.amount ?? 0) || 0);
      }
      return sum;
    }, 0);

    const totalOrders = ordersList.length;

    // Sales trend for last 7 days (including today)
    const salesByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const daySales = ordersList.reduce((sum, o) => {
        if (isCancelled(o)) return sum;
        const od = toDate(o);
        if (!od) return sum;
        if (od.toISOString().slice(0, 10) === dayStr) {
          return sum + (Number(o.total ?? o.totalPrice ?? o.amount ?? 0) || 0);
        }
        return sum;
      }, 0);
      salesByDay.push({ date: dayStr, sales: daySales });
    }

    setDashboard((prev) => ({
      ...prev,
      totalSales,
      todaySales,
      monthlySales,
      totalOrders,
      salesByDay
    }));
  };

  const loadAdmins = async () => {
    if (adminUser?.role !== "superadmin") {
      setAdmins([]);
      return;
    }

    try {
      setAdminsLoading(true);
      const { data } = await api.get("/admin");
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load admins");
    } finally {
      setAdminsLoading(false);
    }
  };

  const loadCoupons = async () => {
    try {
      setCouponsLoading(true);
      const { data } = await api.get("/coupons");
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load coupons");
    } finally {
      setCouponsLoading(false);
    }
  };

  useEffect(() => {
    if (!adminToken) {
      return;
    }

    loadDashboard();
    loadProducts();
    loadOrders();
    loadUsers();
    loadCoupons();
    loadBanners();
  }, [adminToken]);

  useEffect(() => {
    const requested = typeof router.query.section === "string" ? router.query.section : "";
    const nextSection = sectionOptions.includes(requested) ? requested : "dashboard";
    setActiveSection(nextSection);
  }, [router.query.section]);

  // Support linking from the products list: /admin?edit=<productId>
  useEffect(() => {
    const { edit } = router?.query || {};
    if (!edit || !products?.length) return;
    if (editingId) return; // already editing

    const productToEdit = products.find((p) => p._id === edit);
    if (productToEdit) {
      startEdit(productToEdit);
    }
  }, [router?.query?.edit, products]);

  useEffect(() => {
    if (!adminToken) {
      return;
    }

    loadAdmins();
  }, [adminToken, adminUser?.role]);

  useEffect(() => {
    const previewUrls = formData.selectedFiles.map((file) => URL.createObjectURL(file));
    setSelectedFilePreviews(previewUrls);

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [formData.selectedFiles]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 4);
    if (!files.length) return;

    // Do NOT immediately upload. Keep selected files in state and send them with the product FormData.
    setFormData((prev) => ({ ...prev, selectedFiles: files }));
    event.target.value = "";
  };

  const removeExistingImage = (index) => {
    setFormData((prev) => {
      return {
        ...prev,
        existingImages: prev.existingImages.filter((_, currentIndex) => currentIndex !== index)
      };
    });
  };

  const removeSelectedFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      selectedFiles: prev.selectedFiles.filter((_, currentIndex) => currentIndex !== index)
    }));
  };

  const handleImageUrlChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.map((entry, currentIndex) => (currentIndex === index ? value : entry))
    }));
  };

  const addImageUrlField = () => {
    setFormData((prev) => {
      const totalImages =
        prev.existingImages.length +
        prev.selectedFiles.length +
        prev.imageUrls.map((entry) => entry.trim()).filter(Boolean).length;

      if (totalImages >= 4) {
        toast.error("You can add up to 4 images only.");
        return prev;
      }

      return {
        ...prev,
        imageUrls: [...prev.imageUrls, ""]
      };
    });
  };

  const removeImageUrlField = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls:
        prev.imageUrls.length === 1
          ? [""]
          : prev.imageUrls.filter((_, currentIndex) => currentIndex !== index)
    }));
  };

  const handleColorChange = (index, key, value) => {
    setFormData((prev) => {
      const nextColors = prev.colors.map((color, colorIndex) =>
        colorIndex === index ? { ...color, [key]: value } : color
      );
      return { ...prev, colors: nextColors };
    });
  };

  const addColorVariant = () => {
    setFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: "", image: "" }]
    }));
  };

  const removeColorVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.length === 1 ? [{ name: "", image: "" }] : prev.colors.filter((_, colorIndex) => colorIndex !== index)
    }));
  };

  const buildPayload = () => {
    const colors = formData.colors
      .map((entry) => ({
        name: entry.name.trim(),
        image: entry.image.trim()
      }))
      .filter((entry) => entry.name && entry.image);
    const imageUrls = formData.imageUrls.map((entry) => entry.trim()).filter(Boolean).slice(0, 4);

    const payload = new FormData();
    payload.append("name", formData.name.trim());
    payload.append("price", formData.price);
    payload.append("discountPercent", formData.discountPercent);
    payload.append("category", formData.category);
    payload.append("description", formData.description.trim());
    payload.append("colors", JSON.stringify(colors));
    // Append files using the exact field name 'image' (multiple entries allowed)
    formData.selectedFiles.slice(0, 4).forEach((file) => {
      payload.append("image", file);
    });
    formData.existingImages.slice(0, 4).forEach((image) => {
      payload.append("existingImages", image);
    });
    imageUrls.forEach((url) => {
      payload.append("imageUrls", url);
    });

    return {
      payload,
      imageCount:
        formData.existingImages.length +
        formData.selectedFiles.length +
        imageUrls.length
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const { payload, imageCount } = buildPayload();
      if (!imageCount) {
        toast.error("Please add at least one product image or image URL.");
        return;
      }

      if (!formData.name.trim()) {
        toast.error("Product name is required");
        return;
      }

      if (!formData.price || Number(formData.price) <= 0) {
        toast.error("Product price must be greater than 0");
        return;
      }

      if (editingId) {
        await api.put(`/products/${editingId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Product updated successfully");
      } else {
        await api.post("/products/add", payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Product added successfully");
      }

      setFormData(emptyForm);
      setEditingId("");
      await loadProducts();
      await loadDashboard();
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Unable to save product";
      toast.error(msg);
      console.error("Product save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name || "",
      price: product.price || "",
      discountPercent: product.discountPercent ?? "",
      category: normalizeCategory(product.category) || "cake",
      existingImages: Array.isArray(product.images) ? product.images.slice(0, 4) : [],
      imageUrls: [""],
      selectedFiles: [],
      colors: product.colors?.length ? product.colors.map((color) => ({ ...color })) : [{ name: "", image: "" }],
      description: product.description || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) {
      return;
    }

    try {
      setDeleteId(productId);
      await api.delete(`/products/${productId}`);
      toast.success("Product deleted successfully");
      await loadProducts();
      await loadDashboard();
    } catch (error) {
      toast.error("Unable to delete product");
    } finally {
      setDeleteId("");
    }
  };

  const handleAdminCancel = async (orderId) => {
    if (!cancelState.reason.trim() || cancelState.orderId !== orderId) {
      toast.error("Please enter a cancel reason first");
      return;
    }

    try {
      setCancelState((prev) => ({ ...prev, loading: true }));
      const { data } = await api.patch(`/order/${orderId}/cancel`, {
        reason: cancelState.reason,
        cancelledBy: "admin"
      });
      setOrders((prev) => prev.map((order) => (order.orderId === orderId ? data.order : order)));
      setStatusDrafts((prev) => ({ ...prev, [orderId]: data.order.status }));
      setCancelState({ orderId: "", reason: "", loading: false });
      toast.success("Order cancelled successfully");
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to cancel order");
      setCancelState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      setStatusLoadingId(orderId);
      const { data } = await api.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((order) => (order.orderId === orderId ? data.order : order)));
      setStatusDrafts((prev) => ({ ...prev, [orderId]: data.order.status }));
      toast.success(`Order marked as ${status}`);
      loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update order status");
    } finally {
      setStatusLoadingId("");
    }
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    try {
      setAdminSaving(true);
      await api.post("/admin/create", adminForm);
      toast.success("Admin created successfully");
      setAdminForm({ email: "", password: "", role: "admin" });
      loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create admin");
    } finally {
      setAdminSaving(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    try {
      await api.delete(`/admin/${adminId}`);
      toast.success("Admin removed successfully");
      loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to remove admin");
    }
  };

  const handleCreateCoupon = async (event) => {
    event.preventDefault();

    try {
      setCouponSaving(true);
      await api.post("/coupons", {
        code: couponForm.code,
        discountPercent: Number(couponForm.discountPercent || 0)
      });
      toast.success("Coupon created");
      setCouponForm({ code: "", discountPercent: "" });
      loadCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create coupon");
    } finally {
      setCouponSaving(false);
    }
  };

  const handleDeleteCoupon = async (code) => {
    try {
      await api.delete(`/coupons/${encodeURIComponent(code)}`);
      toast.success("Coupon deleted");
      loadCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete coupon");
    }
  };


  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const { data } = await api.get("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success("User deleted");
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete user");
    }
  };

  const handleRoleUpdate = async (userId, role) => {
    try {
      await api.patch(`/users/${userId}/role`, { role });
      toast.success("User role updated");
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update user role");
    }
  };

  const loadBanners = async () => {
    try {
      setBannersLoading(true);
      const { data } = await api.get("/banner/all");
      setBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load banners");
    } finally {
      setBannersLoading(false);
    }
  };

  const handleBannerFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const url = URL.createObjectURL(file);
    setBannerPreview(url);
    event.target.value = "";
  };

  const handleBannerUpload = async (event) => {
    event.preventDefault();
    if (!bannerFile) {
      toast.error("Please select a banner image first");
      return;
    }
    try {
      setBannerUploading(true);
      const formData = new FormData();
      formData.append("image", bannerFile);
      formData.append("title", bannerTitle.trim() || "Homepage Banner");
      await api.post("/banner/upload", formData);
      toast.success("Banner uploaded successfully");
      setBannerFile(null);
      setBannerTitle("Homepage Banner");
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setBannerPreview("");
      loadBanners();
    } catch (error) {
      toast.error(error.response?.data?.message || "Banner upload failed");
    } finally {
      setBannerUploading(false);
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    try {
      await api.delete(`/banner/${bannerId}`);
      toast.success("Banner deleted");
      loadBanners();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete banner");
    }
  };

  const handleActivateBanner = async (bannerId) => {
    try {
      await api.patch(`/banner/${bannerId}/activate`);
      toast.success("Banner activated");
      loadBanners();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to activate banner");
    }
  };

  const dashboardCards = [
    { label: "Total Sales", value: formatCurrency(dashboard.totalSales) },
    { label: "Today's Sales", value: formatCurrency(dashboard.todaySales) },
    { label: "Monthly Sales", value: formatCurrency(dashboard.monthlySales) },
    { label: "Total Orders", value: dashboard.totalOrders }
  ];

  return (
    <>
      <Seo title="Admin Panel" description="Simple product and order management panel for Ramji Bakery." path="/admin" />
      <AdminGuard>
      <section className="section-shell py-12">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside>
            <Sidebar
              onLogout={() => {
                setAdminToken("");
                setAdminUser(null);
              }}
              activeSection={activeSection}
            />
          </aside>
          <main>
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-caramel">Admin dashboard</p>
            <h1 className="mt-2 font-heading text-4xl text-cocoa">Run bakery operations with live data</h1>
            <p className="mt-2 text-sm text-mocha/70">
              Signed in as {adminUser?.email || "admin"} ({adminUser?.role || "admin"})
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              setAdminToken("");
              setAdminUser(null);
            }}
          >
            Logout
          </button>
        </div>

        {activeSection === "dashboard" ? (
          <>
            <div className="mb-8">
              <DashboardCards cards={dashboardCards} loading={dashboardLoading} />
            </div>

            {dashboard.salesByDay?.length ? (
              <div className="glass-panel mb-8 p-6">
                <SectionHeader
                  eyebrow="Sales trend"
                  title="Last 7 days of sales"
                  description="A quick view of bakery performance to help you spot strong and weak sales days."
                />
                <div className="mt-6 grid gap-4 md:grid-cols-7">
                  {dashboard.salesByDay.map((entry) => {
                    const maxSales = Math.max(...dashboard.salesByDay.map((item) => item.sales), 1);
                    return (
                      <div key={entry.date} className="rounded-[22px] bg-latte/30 p-4">
                        <div className="flex h-36 items-end justify-center">
                          <div
                            className="w-12 rounded-full bg-caramel/80"
                            style={{ height: `${Math.max(12, (entry.sales / maxSales) * 100)}%` }}
                          />
                        </div>
                        <p className="mt-3 text-center text-xs font-semibold text-cocoa">{entry.date.slice(5)}</p>
                        <p className="mt-1 text-center text-xs text-mocha/60">{formatCurrency(entry.sales)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          {activeSection === "products" ? (
            <>
              <div className="glass-panel h-fit p-6">
                <SectionHeader
                  eyebrow="Product management"
                  title="Owner dashboard for bakery product updates"
                  description="Upload local images, add online image URLs, edit prices anytime and manage live products."
                />

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                  {[
                    { key: "name", label: "Product Name", type: "text", placeholder: "Chocolate Cake" },
                    { key: "price", label: "Price", type: "number", placeholder: "499" },
                    { key: "discountPercent", label: "Discount (%)", type: "number", placeholder: "10" }
                  ].map((field) => (
                    <label key={field.key} className="block">
                      <span className="mb-2 block text-sm font-semibold text-cocoa">{field.label}</span>
                      <input
                        required={field.key !== "description" && field.key !== "discountPercent"}
                        type={field.type}
                        className="soft-input"
                        value={formData[field.key]}
                        placeholder={field.placeholder}
                        onChange={(event) => handleChange(field.key, event.target.value)}
                      />
                    </label>
                  ))}

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-cocoa">Category</span>
                    <select
                      className="soft-input"
                      value={formData.category}
                      onChange={(event) => handleChange("category", event.target.value)}
                    >
                      {productCategories.map((cat) => (
                        <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-cocoa">Description</span>
                    <textarea
                      className="soft-input"
                      rows={3}
                      placeholder="Short product description"
                      value={formData.description}
                      onChange={(event) => handleChange("description", event.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-cocoa">Product Images (up to 4)</span>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      multiple
                      className="soft-input file:mr-4 file:rounded-full file:border-0 file:bg-cocoa file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream"
                      onChange={handleImageUpload}
                    />
                    <p className="mt-2 text-xs text-mocha/60">Select up to 4 JPG, PNG or WebP files from your device. These will be uploaded with the product form.</p>
                  </label>

                  {formData.existingImages.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-cocoa">Current Images</p>
                      <div className="flex flex-wrap gap-3">
                        {formData.existingImages.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img src={img} alt={`existing-${idx}`} className="h-20 w-20 rounded-xl object-cover" />
                            <button
                              type="button"
                              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                              onClick={() => removeExistingImage(idx)}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFilePreviews.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-cocoa">Selected Files</p>
                      <div className="flex flex-wrap gap-3">
                        {selectedFilePreviews.map((url, idx) => (
                          <div key={idx} className="relative">
                            <img src={url} alt={`selected-${idx}`} className="h-20 w-20 rounded-xl object-cover" />
                            <button
                              type="button"
                              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                              onClick={() => removeSelectedFile(idx)}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button className="btn-primary flex-1" disabled={isSaving}>
                      {isSaving ? (
                        <span className="inline-flex items-center gap-2">
                          <LoaderCircle size={18} className="animate-spin" /> Saving...
                        </span>
                      ) : editingId ? (
                        "Update Product"
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <PlusCircle size={18} /> Add Product
                        </span>
                      )}
                    </button>
                    {editingId ? (
                      <button type="button" className="btn-secondary flex-1" onClick={() => { setEditingId(""); setFormData(emptyForm); }}>
                        Cancel Edit
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>

              <div className="space-y-8">
                <div className="glass-panel p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">Product list</p>
                      <h2 className="mt-2 font-heading text-3xl text-cocoa">Current bakery products</h2>
                    </div>
                    <button className="btn-secondary" onClick={loadProducts}>Refresh List</button>
                  </div>

                  {isLoading ? (
                    <div className="flex min-h-64 items-center justify-center">
                      <LoaderCircle size={28} className="animate-spin text-caramel" />
                    </div>
                  ) : (
                    <div className="mt-8">
                      <ProductTable products={products} onEdit={startEdit} onDelete={handleDelete} deletingId={deleteId} />
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}

          {/* Orders View */}
          {activeSection === "orders" ? (
            <>
              <div className="glass-panel p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel">Order control</p>
                    <h2 className="mt-2 font-heading text-3xl text-cocoa">Manage customer orders</h2>
                  </div>
                  <button className="btn-secondary" onClick={loadOrders}>
                    Refresh Orders
                  </button>
                </div>

                <div className="mt-8 grid gap-5">
                  {orders.map((order) => {
                    return (
                      <div key={order.orderId} className="rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-soft">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="font-semibold text-cocoa">{order.orderId}</p>
                            <p className="mt-1 text-sm text-mocha/65">
                              {order.customer} | {order.phone} | {formatCurrency(order.total)}
                            </p>
                            <p className="mt-2 text-sm text-mocha/60">{order.address}</p>
                          </div>

                          <div className="space-y-3 lg:max-w-sm">
                            <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getOrderStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <p className="text-sm leading-6 text-mocha/70">{getOrderTrackingMessage(order.status)}</p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3">
                          {order.items?.map((item, index) => (
                            <div
                              key={`${order.orderId}-${index}`}
                              className="flex flex-col gap-4 rounded-[22px] bg-latte/20 p-4 sm:flex-row sm:items-center"
                            >
                              <img
                                src={item.image || "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=500&q=80"}
                                alt={item.name}
                                className="h-20 w-full rounded-[18px] object-cover sm:w-20"
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

                        {order.cancelReason ? (
                          <p className="mt-4 rounded-[20px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            Cancel reason: {order.cancelReason} ({order.cancelledBy})
                          </p>
                        ) : null}

                        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex flex-wrap gap-3">
                            <select
                              className="soft-input min-w-[220px]"
                              value={statusDrafts[order.orderId] || order.status}
                              onChange={(event) =>
                                setStatusDrafts((prev) => ({ ...prev, [order.orderId]: event.target.value }))
                              }
                              disabled={order.status === "Cancelled" || order.status === "Delivered"}
                            >
                              {ORDER_STATUSES.filter((status) => status !== "Cancelled").map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <button
                              className="btn-primary"
                              onClick={() => handleStatusUpdate(order.orderId, statusDrafts[order.orderId] || order.status)}
                              disabled={
                                statusLoadingId === order.orderId ||
                                (statusDrafts[order.orderId] || order.status) === order.status ||
                                order.status === "Cancelled" ||
                                order.status === "Delivered"
                              }
                            >
                              {statusLoadingId === order.orderId ? "Updating..." : "Update Status"}
                            </button>
                          </div>

                          {canCancelOrder(order.status) ? (
                            <div className="flex w-full flex-col gap-3 xl:max-w-xl xl:flex-row">
                              <input
                                className="soft-input"
                                placeholder="Out of stock or issue? Add cancel reason"
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
                                className="rounded-full border border-rose/30 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                                onClick={() => handleAdminCancel(order.orderId)}
                                disabled={cancelState.loading && cancelState.orderId === order.orderId}
                              >
                                {cancelState.loading && cancelState.orderId === order.orderId ? "Cancelling..." : "Cancel Order"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  {!orders.length ? (
                    <div className="rounded-[24px] bg-latte/30 p-6 text-center text-sm text-mocha/70">No orders found yet.</div>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          {/* Banner Management */}
          {activeSection === "banner" ? (
            <div className="glass-panel col-span-full p-6">
              <SectionHeader
                eyebrow="Homepage banner"
                title="Manage homepage banner image"
                description="Upload a new banner image to replace the hero section image on the homepage. Only one banner is active at a time."
              />

              <form className="mt-6 space-y-4" onSubmit={handleBannerUpload}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-cocoa">Banner Title</span>
                  <input
                    type="text"
                    className="soft-input"
                    placeholder="Homepage Banner"
                    value={bannerTitle}
                    onChange={(event) => setBannerTitle(event.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-cocoa">Banner Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="soft-input file:mr-4 file:rounded-full file:border-0 file:bg-cocoa file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream"
                    onChange={handleBannerFileChange}
                  />
                  <p className="mt-2 text-xs text-mocha/60">
                    Recommended: landscape image, at least 1200×600px for best display on all devices.
                  </p>
                </label>

                {bannerPreview && (
                  <div className="mt-3">
                    <p className="mb-2 text-sm font-semibold text-cocoa">Preview</p>
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="max-h-48 w-full rounded-[20px] object-cover"
                    />
                  </div>
                )}

                <button className="btn-primary" disabled={bannerUploading || !bannerFile}>
                  {bannerUploading ? (
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle size={18} className="animate-spin" /> Uploading...
                    </span>
                  ) : (
                    "Upload Banner"
                  )}
                </button>
              </form>

              <div className="mt-8">
                <h3 className="font-heading text-xl text-cocoa">Existing Banners</h3>
                {bannersLoading ? (
                  <div className="mt-4 flex items-center justify-center py-8">
                    <LoaderCircle size={28} className="animate-spin text-caramel" />
                  </div>
                ) : banners.length ? (
                  <div className="mt-4 grid gap-4">
                    {banners.map((banner) => (
                      <div
                        key={banner.id}
                        className={`flex flex-col gap-4 rounded-[24px] border p-4 sm:flex-row sm:items-center ${
                          banner.isActive
                            ? "border-caramel/40 bg-latte/30"
                            : "border-white/60 bg-white/80"
                        }`}
                      >
                        <img
                          src={banner.image}
                          alt={banner.title}
                          className="h-24 w-full rounded-[18px] object-cover sm:w-40"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-cocoa">{banner.title}</p>
                          <p className="mt-1 text-xs text-mocha/60">
                            {new Date(banner.createdAt).toLocaleDateString()}
                          </p>
                          {banner.isActive && (
                            <span className="mt-2 inline-flex rounded-full bg-caramel/20 px-3 py-1 text-xs font-semibold text-caramel">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!banner.isActive && (
                            <button
                              className="btn-secondary text-sm"
                              onClick={() => handleActivateBanner(banner.id)}
                            >
                              Set Active
                            </button>
                          )}
                          <button
                            className="rounded-full border border-rose/30 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                            onClick={() => handleDeleteBanner(banner.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[24px] bg-latte/30 p-6 text-center text-sm text-mocha/70">
                    No banners uploaded yet. Upload one above to set it as the homepage hero image.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Users View */}
          {activeSection === "users" ? (
            <>
              {adminUser?.role === "superadmin" ? (
                <div className="glass-panel p-6">
                  <SectionHeader
                    eyebrow="Admin management"
                    title="Create and manage admin users"
                    description="Superadmin can add new admins and review who has access to bakery operations."
                  />

                  <form className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]" onSubmit={handleCreateAdmin}>
                    <input
                      className="soft-input"
                      type="email"
                      placeholder="admin@ramjibakery.in"
                      value={adminForm.email}
                      onChange={(event) => setAdminForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                    <input
                      className="soft-input"
                      type="password"
                      placeholder="Password"
                      value={adminForm.password}
                      onChange={(event) => setAdminForm((prev) => ({ ...prev, password: event.target.value }))}
                    />
                    <select
                      className="soft-input"
                      value={adminForm.role}
                      onChange={(event) => setAdminForm((prev) => ({ ...prev, role: event.target.value }))}
                    >
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                    <button className="btn-primary" disabled={adminSaving}>
                      {adminSaving ? "Saving..." : "Create Admin"}
                    </button>
                  </form>

                  <div className="mt-6 grid gap-4">
                    {adminsLoading ? (
                      <div className="rounded-[24px] bg-latte/30 p-4 text-sm text-mocha/70">Loading admins...</div>
                    ) : (
                      admins.map((admin) => (
                        <div
                          key={admin.id}
                          className="flex flex-col gap-3 rounded-[24px] border border-white/60 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-cocoa">{admin.email}</p>
                            <p className="text-sm text-mocha/60">{admin.role}</p>
                          </div>
                          {admin.role !== "superadmin" ? (
                            <button
                              className="rounded-full border border-rose/30 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                              onClick={() => handleDeleteAdmin(admin.id)}
                            >
                              Remove Admin
                            </button>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              <div className="glass-panel p-6">
                <SectionHeader
                  eyebrow="Customer accounts"
                  title="Manage customer accounts"
                  description="View customer accounts, verify status, and control account roles."
                />
                {usersLoading ? (
                  <div className="rounded-[24px] bg-latte/30 p-4 text-sm text-mocha/70">Loading users...</div>
                ) : users.length ? (
                  <div className="mt-6 grid gap-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col gap-3 rounded-[24px] border border-white/60 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-cocoa">{user.name}</p>
                          <p className="text-sm text-mocha/60">{user.email}</p>
                          <p className="text-xs text-mocha/60">Status: {user.emailVerified ? "Verified" : "Unverified"}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {adminUser?.role === "superadmin" ? (
                            <select
                              className="soft-input"
                              value={user.role}
                              onChange={(event) => handleRoleUpdate(user.id, event.target.value)}
                            >
                              <option value="customer">Customer</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : null}
                          <button
                            className="rounded-full border border-rose/30 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[24px] bg-latte/30 p-4 text-sm text-mocha/70">No users found.</div>
                )}
              </div>
            </>
          ) : null}
          {activeSection === "coupons" ? (
            <div className="glass-panel p-6">
              <SectionHeader
                eyebrow="Coupons"
                title="Manage discount coupons"
                description="Create percentage coupons for seasonal offers and remove old codes anytime."
              />

              <form className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={handleCreateCoupon}>
                <input
                  className="soft-input"
                  placeholder="RAMJI10"
                  value={couponForm.code}
                  onChange={(event) => setCouponForm((prev) => ({ ...prev, code: event.target.value }))}
                />
                <input
                  className="soft-input"
                  type="number"
                  placeholder="10"
                  value={couponForm.discountPercent}
                  onChange={(event) => setCouponForm((prev) => ({ ...prev, discountPercent: event.target.value }))}
                />
                <button className="btn-primary" disabled={couponSaving}>
                  {couponSaving ? "Saving..." : "Add Coupon"}
                </button>
              </form>

              <div className="mt-6 grid gap-4">
                {couponsLoading ? (
                  <div className="rounded-[24px] bg-latte/30 p-4 text-sm text-mocha/70">Loading coupons...</div>
                ) : coupons.length ? (
                  coupons.map((coupon) => (
                    <div
                      key={coupon.code}
                      className="flex flex-col gap-3 rounded-[24px] border border-white/60 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-cocoa">{coupon.code}</p>
                        <p className="text-sm text-mocha/60">{coupon.discountPercent}% off</p>
                      </div>
                      <button
                        className="rounded-full border border-rose/30 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        onClick={() => handleDeleteCoupon(coupon.code)}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] bg-latte/30 p-4 text-sm text-mocha/70">No coupons created yet.</div>
                )}
              </div>
            </div>
          ) : null}

          {activeSection === "images" ? (
            <div className="glass-panel p-6">
              <SectionHeader
                eyebrow="Image library"
                title="Manage reusable product images"
                description="Upload once and reuse images across multiple products."
              />
              <div className="mt-6">
                <Link href="/admin/images" className="btn-primary">
                  Open Image Library
                </Link>
              </div>
            </div>
          ) : null}

          {activeSection === "settings" ? (
            <div className="glass-panel p-6">
              <SectionHeader
                eyebrow="Settings"
                title="Store settings"
                description="Add business settings here as new features go live."
              />
              <p className="mt-4 text-sm text-mocha/70">
                Settings are coming soon. Use the sidebar to manage products, orders, coupons, and images.
              </p>
            </div>
          ) : null}
        </div>
          </main>
        </div>
      </section>
      </AdminGuard>
    </>
  );
}
