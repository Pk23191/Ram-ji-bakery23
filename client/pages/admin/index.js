import { LoaderCircle, PencilLine, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminGuard from "../../components/AdminGuard";
import Seo from "../../components/Seo";
import SectionHeader from "../../components/SectionHeader";
import { useShop } from "../../context/ShopContext";
import { categoryLabels, normalizeCategory, normalizeProduct, productCategories } from "../../data/site";
import api from "../../utils/api";
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
    } catch (error) {
      toast.error("Unable to load orders");
    }
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
  }, [adminToken]);

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

    // Immediately upload selected files to backend /api/upload and store returned Cloudinary URLs
    const uploadFiles = async () => {
      setUploadingFiles(true);
      try {
        const existingCount =
          formData.existingImages.length +
          formData.selectedFiles.length +
          formData.imageUrls.map((entry) => entry.trim()).filter(Boolean).length;
        const availableSlots = Math.max(0, 4 - existingCount);
        const toUpload = files.slice(0, availableSlots);

        if (!toUpload.length) {
          toast.error("You can add up to 4 images only.");
          return;
        }

        for (const file of toUpload) {
          const fd = new FormData();
          fd.append("image", file);
          try {
            const { data } = await api.post("/upload", fd);
            const url = data.secure_url || data.url || data.imageUrl || data.url;
            if (url) {
              setFormData((prev) => ({ ...prev, existingImages: [...prev.existingImages, url] }));
            }
          } catch (err) {
            toast.error(err.response?.data?.message || "Upload failed");
          }
        }
      } finally {
        setUploadingFiles(false);
      }
    };

    uploadFiles();
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
    formData.selectedFiles.slice(0, 4).forEach((file) => {
      payload.append("images", file);
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

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success("Product updated successfully");
      } else {
        await api.post("/products", payload);
        toast.success("Product added successfully");
      }

      setFormData(emptyForm);
      setEditingId("");
      await loadProducts();
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save product");
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

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((card) => (
            <div key={card.label} className="glass-panel p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-caramel">{card.label}</p>
              <p className="mt-3 font-heading text-3xl text-cocoa">{dashboardLoading ? "..." : card.value}</p>
            </div>
          ))}
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

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
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
                <span className="mb-2 block text-sm font-semibold text-cocoa">Product Images (up to 4)</span>
                <input
                  type="file"
                  name="images"
                  accept="image/png,image/jpeg"
                  multiple
                  className="soft-input file:mr-4 file:rounded-full file:border-0 file:bg-cocoa file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream"
                  onChange={handleImageUpload}
                />
                <p className="mt-2 text-xs text-mocha/60">
                  Select up to 4 JPG/PNG files from your device. These will be uploaded with the product form.
                </p>
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-cocoa">Online Image URLs</span>
                  <button type="button" className="btn-secondary px-4 py-2" onClick={addImageUrlField}>
                    Add Image URL
                  </button>
                </div>
                <div className="grid gap-3">
                  {formData.imageUrls.map((url, index) => (
                    <div key={`url-${index}`} className="grid gap-3 md:grid-cols-[1fr_auto]">
                      <input
                        className="soft-input"
                        value={url}
                        placeholder="https://example.com/product-image.jpg"
                        onChange={(event) => handleImageUrlChange(index, event.target.value)}
                      />
                      <button
                        type="button"
                        className="rounded-full border border-rose/30 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        onClick={() => removeImageUrlField(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {formData.existingImages.map((image, index) => (
                  <div key={`${image}-${index}`} className="rounded-[20px] border border-white/60 bg-white/80 p-3">
                    <img src={image} alt={`Existing ${index + 1}`} className="h-36 w-full rounded-[14px] object-cover" />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="truncate text-xs text-mocha/60">Saved image {index + 1}</p>
                      <button
                        type="button"
                        className="rounded-full border border-rose/30 px-3 py-1 text-xs font-semibold text-rose-600"
                        onClick={() => removeExistingImage(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {formData.selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="rounded-[20px] border border-white/60 bg-white/80 p-3">
                    <img
                      src={selectedFilePreviews[index] || ""}
                      alt={`Selected ${index + 1}`}
                      className="h-36 w-full rounded-[14px] object-cover"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="truncate text-xs text-mocha/60">{file.name}</p>
                      <button
                        type="button"
                        className="rounded-full border border-rose/30 px-3 py-1 text-xs font-semibold text-rose-600"
                        onClick={() => removeSelectedFile(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {formData.imageUrls
                  .map((entry) => entry.trim())
                  .filter(Boolean)
                  .map((image, index) => (
                    <div key={`${image}-${index}`} className="rounded-[20px] border border-white/60 bg-white/80 p-3">
                      <img src={image} alt={`URL ${index + 1}`} className="h-36 w-full rounded-[14px] object-cover" />
                      <div className="mt-3">
                        <p className="truncate text-xs text-mocha/60">Online image {index + 1}</p>
                      </div>
                    </div>
                  ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-cocoa">Category</span>
                <select
                  className="soft-input"
                  value={formData.category}
                  onChange={(event) => handleChange("category", event.target.value)}
                >
                  {productCategories.map((item) => (
                    <option key={item} value={item}>
                      {categoryLabels[item] || item}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-cocoa">Color Variants</span>
                  <button type="button" className="btn-secondary px-4 py-2" onClick={addColorVariant}>
                    Add Color
                  </button>
                </div>
                <div className="grid gap-3">
                  {formData.colors.map((color, index) => (
                    <div key={`color-${index}`} className="rounded-[24px] border border-[#ead8c5] bg-white/70 p-4">
                      <div className="grid gap-3 md:grid-cols-[0.7fr_1.3fr_auto]">
                        <input
                          className="soft-input"
                          value={color.name}
                          placeholder="Rose Gold"
                          onChange={(event) => handleColorChange(index, "name", event.target.value)}
                        />
                        <input
                          className="soft-input"
                          value={color.image}
                          placeholder="https://example.com/rose-gold.jpg"
                          onChange={(event) => handleColorChange(index, "image", event.target.value)}
                        />
                        <button
                          type="button"
                          className="rounded-full border border-rose/30 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                          onClick={() => removeColorVariant(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-cocoa">Description (Optional)</span>
                <textarea
                  rows="4"
                  className="soft-input"
                  value={formData.description}
                  placeholder="Soft sponge with rich chocolate cream..."
                  onChange={(event) => handleChange("description", event.target.value)}
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="btn-primary flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle size={18} className="animate-spin" />
                      Saving...
                    </span>
                  ) : editingId ? (
                    "Update Product"
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <PlusCircle size={18} />
                      Add Product
                    </span>
                  )}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    className="btn-secondary flex-1"
                    onClick={() => {
                      setEditingId("");
                      setFormData(emptyForm);
                    }}
                  >
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
                <button className="btn-secondary" onClick={loadProducts}>
                  Refresh List
                </button>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <LoaderCircle size={28} className="animate-spin text-caramel" />
                </div>
              ) : (
                <div className="mt-8 grid gap-4">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="flex flex-col gap-4 rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-soft sm:flex-row sm:items-center"
                    >
                      <img
                        src={product.images?.[0] || product.image}
                        alt={product.name}
                        className="h-24 w-full rounded-[20px] object-cover sm:w-24"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-[0.24em] text-caramel">
                          {categoryLabels[product.category] || product.category}
                        </p>
                        <h3 className="mt-1 font-semibold text-cocoa">{product.name}</h3>
                        <p className="mt-1 text-sm text-mocha/70">{formatCurrency(product.finalPrice ?? product.price)}</p>
                        {product.discountPercent ? (
                          <p className="mt-1 text-xs text-emerald-700">{product.discountPercent}% off</p>
                        ) : null}
                        <p className="mt-1 text-xs text-mocha/55">
                          {product.images?.length || 0} images | {product.colors?.length || 0} color variants
                        </p>
                        {product.description ? <p className="mt-2 text-sm text-mocha/60">{product.description}</p> : null}
                      </div>
                      <div className="flex gap-3">
                        <button className="btn-secondary px-4 py-2" onClick={() => startEdit(product)}>
                          <PencilLine size={16} className="mr-2" />
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-rose/30 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                          onClick={() => handleDelete(product._id)}
                          disabled={deleteId === product._id}
                        >
                          {deleteId === product._id ? (
                            "Deleting..."
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <Trash2 size={16} />
                              Delete
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  {!products.length ? (
                    <div className="rounded-[24px] bg-latte/30 p-6 text-center text-sm text-mocha/70">
                      No products found. Add your first bakery item using the form.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

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
                  <div className="rounded-[24px] bg-latte/30 p-6 text-center text-sm text-mocha/70">
                    No orders found yet.
                  </div>
                ) : null}
              </div>
            </div>

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
          </div>
        </div>
      </section>
      </AdminGuard>
    </>
  );
}
