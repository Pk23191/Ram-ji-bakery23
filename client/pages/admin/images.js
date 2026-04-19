import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminGuard from "../../components/AdminGuard";
import Seo from "../../components/Seo";
import { useRouter } from "next/router";
import AdminHeader from "../../components/admin/AdminHeader";
import Sidebar from "../../components/admin/Sidebar";
import { useShop } from "../../context/ShopContext";
import api from "../../utils/api";

export default function AdminImagesPage() {
  const router = useRouter();
  const { setAdminToken, setAdminUser } = useShop();
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/images");
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load images");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 4);
    setSelectedFiles(files);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFiles.length) {
      toast.error("Please select images to upload");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("images", file));
      const { data } = await api.post("/images", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Images uploaded successfully");
      setSelectedFiles([]);
      setImages((prev) => [...(data.images || []), ...prev]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await api.delete(`/images/${id}`);
      setImages((prev) => prev.filter((item) => item._id !== id));
      toast.success("Image deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete image");
    }
  };

  return (
    <AdminGuard>
      <Seo title="Image Library" description="Manage reusable images for Ramji Bakery." path="/admin/images" />
      <section className="section-shell py-10">
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="glass-panel h-fit p-4">
            <Sidebar
              activeSection="images"
              onLogout={() => {
                setAdminToken("");
                setAdminUser(null);
                router.replace("/admin/login");
              }}
            />
          </div>
          <div className="glass-panel p-6">
            <AdminHeader
              title="Image Library"
              subtitle="Reusable assets"
              rightNode={
                <span className="rounded-full bg-latte/60 px-4 py-2 text-xs font-semibold text-cocoa">
                  {images.length} images
                </span>
              }
            />

            <form onSubmit={handleUpload} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-cocoa">Upload images (max 4)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="soft-input file:mr-4 file:rounded-full file:border-0 file:bg-cocoa file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream"
                  onChange={handleFileChange}
                />
              </label>
              <button className="btn-primary" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Images"}
              </button>
            </form>

            <div className="mt-8">
              {isLoading ? (
                <div className="rounded-[24px] bg-latte/30 p-4 text-sm text-mocha/70">Loading images...</div>
              ) : images.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image) => (
                    <div
                      key={image._id}
                      className="overflow-hidden rounded-[20px] border border-white/60 bg-white/80 shadow-soft"
                    >
                      <img
                        src={image.url}
                        alt="Uploaded"
                        className="h-40 w-full object-cover"
                        loading="lazy"
                      />
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-mocha/60">
                          {new Date(image.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          className="rounded-full border border-rose/30 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                          onClick={() => handleDelete(image._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] bg-latte/30 p-4 text-sm text-mocha/70">
                  No images uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AdminGuard>
  );
}
