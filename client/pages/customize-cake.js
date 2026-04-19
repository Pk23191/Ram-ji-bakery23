import { useRef, useState } from "react";
import { CakeSlice, ImagePlus, Palette, Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Seo from "../components/Seo";
import SectionHeader from "../components/SectionHeader";
import { useShop } from "../context/ShopContext";
import api from "../utils/api";
import { defaultCustomization } from "../data/site";

const customCakeProduct = {
  _id: "custom-cake",
  name: "Custom Celebration Cake",
  category: "cake",
  price: 1199
};

export default function CustomizeCakePage() {
  const fileInputRef = useRef(null);
  const { customCake, setCustomCake, addToCart } = useShop();
  const [customImageFile, setCustomImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const updateField = (field, value) => setCustomCake((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCustomImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => updateField("imagePreview", reader.result);
    reader.readAsDataURL(file);
  };

  const handleAddToCart = async () => {
    if (customImageFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", customImageFile);
        
        const { data } = await api.post("/upload/single", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        const secureUrl = data.secure_url || data.url;
        
        const customizations = { ...customCake };
        delete customizations.imagePreview; // Remove the heavy base64
        
        addToCart({ ...customCakeProduct, customImage: secureUrl, image: secureUrl }, 1, customizations);
        setCustomImageFile(null);
        setCustomCake(defaultCustomization);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
      }
    } else {
      addToCart(customCakeProduct, 1, customCake);
      setCustomCake(defaultCustomization);
    }
  };

  return (
    <>
      <Seo
        title="Customize Cake"
        description="Design your dream cake with flavor, size, cream, image upload and custom message options."
        path="/customize-cake"
      />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="Custom orders"
          title="Design a cake that feels personal and premium"
          description="Built for birthdays, anniversaries and milestone celebrations with a live visual preview."
        />
        <div className="mt-10 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-panel p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-cocoa">Cake Flavor</span>
                <select className="soft-input" value={customCake.flavor} onChange={(e) => updateField("flavor", e.target.value)}>
                  {["Chocolate", "Vanilla", "Butterscotch", "Black Forest", "Mango"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-cocoa">Size</span>
                <select className="soft-input" value={customCake.size} onChange={(e) => updateField("size", e.target.value)}>
                  {["0.5 Kg", "1 Kg", "1.5 Kg", "2 Kg", "3 Kg"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-cocoa">Cream Type</span>
                <select className="soft-input" value={customCake.cream} onChange={(e) => updateField("cream", e.target.value)}>
                  {["Whipped Cream", "Buttercream", "Ganache", "Fresh Fruit Cream"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-cocoa">Custom Message</span>
                <input
                  className="soft-input"
                  value={customCake.message}
                  maxLength={28}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Happy Birthday Aarav"
                />
              </label>
            </div>

            <div className="mt-5 rounded-[24px] border border-dashed border-caramel/35 bg-latte/30 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-cocoa">Upload inspiration image</p>
                  <p className="mt-1 text-sm text-mocha/65">Reference image helps our bakery team match style faster.</p>
                </div>
                <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus size={16} className="mr-2" />
                  Upload
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button disabled={isUploading} className="btn-primary" onClick={handleAddToCart}>
                {isUploading ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                {isUploading ? "Uploading image & Adding..." : "Add Customized Cake"}
              </button>
              <button className="btn-secondary" onClick={() => {
                  setCustomCake(defaultCustomization);
                  setCustomImageFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
              }}>
                Reset Builder
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] bg-cocoa p-6 text-cream shadow-float">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(243,201,196,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(203,214,182,0.18),transparent_30%)]" />
            <div className="relative">
              <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-latte">
                Live Preview
              </div>
              <div className="mt-8 flex min-h-[430px] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/5 px-6 text-center">
                <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-b from-rose to-latte p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
                  <div className="flex h-full w-full items-center justify-center rounded-full border-[10px] border-white/60 bg-white/15 text-center">
                    <div>
                      <CakeSlice className="mx-auto mb-3" size={32} />
                      <p className="font-heading text-2xl">{customCake.flavor}</p>
                      <p className="mt-2 text-sm">{customCake.message}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] bg-white/10 p-4">
                    <Palette size={18} />
                    <p className="mt-2 text-sm text-latte">{customCake.cream}</p>
                  </div>
                  <div className="rounded-[22px] bg-white/10 p-4">
                    <Sparkles size={18} />
                    <p className="mt-2 text-sm text-latte">{customCake.size}</p>
                  </div>
                  <div className="rounded-[22px] bg-white/10 p-4">
                    <ImagePlus size={18} />
                    <p className="mt-2 text-sm text-latte">{customCake.imagePreview ? "Image added" : "No image yet"}</p>
                  </div>
                </div>
                {customCake.imagePreview ? (
                  <img
                    src={customCake.imagePreview}
                    alt="Custom reference"
                    className="mt-8 h-36 w-full rounded-[22px] object-cover"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
