import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, LoaderCircle, MessageSquare, ShoppingBag, Sparkles } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ProductImage from "../../components/ProductImage";
import SectionHeader from "../../components/SectionHeader";
import Seo from "../../components/Seo";
import StarRating from "../../components/StarRating";
import { useShop } from "../../context/ShopContext";
import { normalizeProduct } from "../../data/site";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/helpers";

function resolveGallery(product) {
  return (product?.images?.length ? product.images : [product?.image]).filter(Boolean).slice(0, 4);
}

export default function PartyProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart, customerSession, setCustomerSession } = useShop();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewSort, setReviewSort] = useState("latest");
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [isCustomerLoggingIn, setIsCustomerLoggingIn] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ""
  });
  const [loginForm, setLoginForm] = useState({
    name: "",
    phone: ""
  });

  useEffect(() => {
    if (!id) return;

    let active = true;
    setIsLoading(true);

    async function loadProduct() {
      try {
        const { data } = await api.get(`/products/${id}`);
        const normalized = normalizeProduct(data);
        if (active) {
          setProduct(normalized);
          setSelectedImage(resolveGallery(normalized)[0] || "");
          setSelectedColor(normalized.colors?.[0]?.name || "");
        }
      } catch (error) {
        if (active) {
          toast.error("Unable to load product details");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [id]);

  const gallery = useMemo(() => resolveGallery(product), [product]);

  const getCustomerHeaders = () =>
    customerSession?.token
      ? {
          headers: {
            Authorization: `Bearer ${customerSession.token}`
          }
        }
      : {};

  useEffect(() => {
    if (!product) return;
    if (!selectedImage) {
      setSelectedImage(gallery[0] || "");
    }
  }, [product, gallery, selectedImage]);

  useEffect(() => {
    setLoginForm({
      name: customerSession?.name || "",
      phone: customerSession?.phone || ""
    });
  }, [customerSession?.name, customerSession?.phone]);

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadReviews() {
      try {
        setIsReviewsLoading(true);
        const { data } = await api.get(`/reviews/${id}`, {
          params: { sort: reviewSort },
          ...getCustomerHeaders()
        });

        if (!active) return;

        setReviews(data.reviews || []);
        setAverageRating(Number(data.averageRating || 0));
        setTotalReviews(Number(data.totalReviews || 0));
        setHasReviewed(Boolean(data.hasReviewed));
      } catch (error) {
        if (active) {
          toast.error("Unable to load reviews right now");
        }
      } finally {
        if (active) {
          setIsReviewsLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, [id, reviewSort, customerSession?.token]);

  const handleColorSelect = (color) => {
    setSelectedColor(color.name);
    setSelectedImage(color.image);
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart(
      {
        ...product,
        image: selectedImage || gallery[0] || product.image
      },
      1,
      selectedColor ? { color: selectedColor } : null
    );
  };

  const handleCustomerLogin = async (event) => {
    event.preventDefault();

    try {
      setIsCustomerLoggingIn(true);
      const { data } = await api.post("/auth/customer-login", loginForm);
      setCustomerSession({
        ...data.customer,
        token: data.token
      });
      toast.success("You can review now");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to login");
    } finally {
      setIsCustomerLoggingIn(false);
    }
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!customerSession?.token) {
      toast.error("Login to review this product");
      return;
    }

    try {
      setIsReviewSubmitting(true);
      const { data } = await api.post(
        "/reviews",
        {
          productId: id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        },
        getCustomerHeaders()
      );

      const nextReviews = [data.review, ...reviews];
      setReviews(nextReviews);
      const nextTotal = nextReviews.length;
      const nextAverage = Number(
        (nextReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / nextTotal).toFixed(1)
      );

      setTotalReviews(nextTotal);
      setAverageRating(nextAverage);
      setHasReviewed(true);
      setReviewForm({ rating: 5, comment: "" });
      toast.success("Thanks for sharing your review");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to submit review");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="section-shell py-16">
        <div className="glass-panel p-8 text-sm text-mocha/70">Loading party product...</div>
      </section>
    );
  }

  if (!product) {
    return (
      <>
        <Seo title="Party Product" description="Party accessory details from Ramji Bakery." path={`/party/${id || ""}`} />
        <section className="section-shell py-16">
          <div className="glass-panel p-10 text-center">
            <h1 className="font-heading text-3xl text-cocoa">Product Not Found</h1>
            <p className="mt-3 text-sm text-mocha/70">This party accessory is unavailable right now.</p>
            <Link href="/party" className="btn-primary mt-6">
              Back to Party Accessories
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Seo
        title={product.name}
        description={product.description}
        path={`/party/${product._id}`}
      />
      <section className="section-shell py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-mocha/60">
          <Link href="/" className="hover:text-cocoa">
            Home
          </Link>
          <ChevronRight size={14} />
          <Link href="/party" className="hover:text-cocoa">
            Party Accessories
          </Link>
          <ChevronRight size={14} />
          <span className="text-cocoa">{product.name}</span>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-[36px] border border-white/60 bg-white/75 p-3 shadow-soft">
              <div className="relative h-[360px] overflow-hidden rounded-[28px] bg-[#fff7ef] sm:h-[520px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <ProductImage
                      src={selectedImage || gallery[0] || product.image}
                      alt={product.name}
                      fill
                      priority
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`relative h-20 overflow-hidden rounded-[22px] border p-1 transition sm:h-24 ${
                    selectedImage === image ? "border-caramel bg-white shadow-soft" : "border-white/60 bg-white/70"
                  }`}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-[18px]">
                    <ProductImage src={image} alt={`${product.name} view ${index + 1}`} fill className="object-cover" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 sm:p-8">
            <div className="inline-flex rounded-full bg-latte px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-caramel">
              <Sparkles size={14} className="mr-2" />
              Party accessory
            </div>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-heading text-4xl text-cocoa sm:text-5xl">{product.name}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-mocha/70">{product.description}</p>
              </div>
              <div className="rounded-[24px] bg-white px-4 py-3 text-sm font-semibold text-cocoa shadow-soft">
                <div className="flex items-center gap-3">
                  <StarRating rating={Math.round(averageRating || product.rating || 0)} size={16} />
                  <span>{(averageRating || product.rating || 0).toFixed(1)}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-mocha/60">{totalReviews} review{totalReviews === 1 ? "" : "s"}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 rounded-[28px] bg-[#fff7ef] p-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-mocha/50">Price</p>
                <p className="mt-2 text-2xl font-extrabold text-cocoa">
                  {formatCurrency(product.finalPrice ?? product.price)}
                </p>
                {product.originalPrice > (product.finalPrice ?? product.price) ? (
                  <p className="mt-1 text-sm text-mocha/50 line-through">{formatCurrency(product.originalPrice)}</p>
                ) : (
                  <p className="mt-1 text-sm text-mocha/60">Free Delivery</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-mocha/50">Gallery</p>
                <p className="mt-2 text-base font-semibold text-cocoa">{gallery.length} curated images</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-mocha/50">Variants</p>
                <p className="mt-2 text-base font-semibold text-cocoa">{product.colors?.length || 0} color options</p>
              </div>
            </div>

            <div className="mt-8">
              <SectionHeader
                eyebrow="Choose a color"
                title="Select the look that matches your celebration"
                description="Each color option swaps to its matching product image for a confident buying decision."
              />
              <div className="mt-5 flex flex-wrap gap-3">
                {(product.colors?.length ? product.colors : []).map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-semibold transition ${
                      selectedColor === color.name
                        ? "border-cocoa bg-cocoa text-cream shadow-soft"
                        : "border-caramel/30 bg-white text-cocoa hover:bg-latte/40"
                    }`}
                  >
                    <span className="h-9 w-9 overflow-hidden rounded-full border border-white/70">
                      <ProductImage src={color.image} alt={color.name} width={36} height={36} className="h-full w-full object-cover" />
                    </span>
                    {color.name}
                    {selectedColor === color.name ? <Check size={16} /> : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/60 bg-white/80 p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-mocha/50">Selected variant</p>
                  <p className="mt-2 text-lg font-semibold text-cocoa">{selectedColor || "Standard"}</p>
                </div>
                <button className="btn-primary w-full sm:w-auto" onClick={handleAddToCart}>
                  <ShoppingBag size={18} className="mr-2" />
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="glass-panel p-6 sm:p-8">
            <SectionHeader
              eyebrow="Customer reviews"
              title="Ratings from bakery customers"
              description="Verified customers can rate once and share their real buying experience."
            />

            <div className="mt-6 rounded-[28px] bg-[#fff7ef] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-mocha/50">Average rating</p>
                  <div className="mt-2 flex items-center gap-3">
                    <p className="text-3xl font-extrabold text-cocoa">{(averageRating || 0).toFixed(1)}</p>
                    <StarRating rating={Math.round(averageRating)} size={18} />
                  </div>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-cocoa shadow-soft">
                  {totalReviews} review{totalReviews === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div className="mt-6">
              {!customerSession ? (
                <form onSubmit={handleCustomerLogin} className="space-y-4 rounded-[28px] border border-white/60 bg-white/80 p-5">
                  <div>
                    <p className="text-lg font-semibold text-cocoa">Login to review</p>
                    <p className="mt-1 text-sm text-mocha/70">Use the same name and phone you used for your bakery order.</p>
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
                  <button className="btn-primary w-full" disabled={isCustomerLoggingIn}>
                    {isCustomerLoggingIn ? "Signing in..." : "Login to Review"}
                  </button>
                </form>
              ) : hasReviewed ? (
                <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-lg font-semibold text-emerald-800">You already reviewed this product</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-700">
                    Thanks, {customerSession.name}. Each customer can leave one review per product.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4 rounded-[28px] border border-white/60 bg-white/80 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-cocoa">Write a review</p>
                      <p className="mt-1 text-sm text-mocha/70">Tell other customers how this party accessory looked and felt in person.</p>
                    </div>
                    <div className="rounded-full bg-latte/50 px-4 py-2 text-sm font-semibold text-cocoa">
                      {customerSession.name}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-cocoa">Your rating</p>
                    <StarRating
                      rating={reviewForm.rating}
                      interactive
                      onChange={(value) => setReviewForm((prev) => ({ ...prev, rating: value }))}
                      size={24}
                      className="mt-2"
                    />
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-cocoa">Your review</span>
                    <textarea
                      rows="4"
                      className="soft-input"
                      placeholder="Describe quality, colors, packaging, and overall celebration impact."
                      value={reviewForm.comment}
                      onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                    />
                  </label>

                  <button className="btn-primary w-full" disabled={isReviewSubmitting}>
                    {isReviewSubmitting ? "Submitting review..." : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-caramel">Community feedback</p>
                <h2 className="mt-2 font-heading text-3xl text-cocoa">What customers are saying</h2>
              </div>

              <label className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-cocoa shadow-soft">
                Sort
                <select
                  value={reviewSort}
                  onChange={(event) => setReviewSort(event.target.value)}
                  className="bg-transparent outline-none"
                >
                  <option value="latest">Latest</option>
                  <option value="highest">Highest rating</option>
                </select>
              </label>
            </div>

            {isReviewsLoading ? (
              <div className="flex min-h-56 items-center justify-center">
                <LoaderCircle size={28} className="animate-spin text-caramel" />
              </div>
            ) : reviews.length ? (
              <div className="mt-6 grid gap-4">
                {reviews.map((review) => (
                  <article key={review._id} className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-soft">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-cocoa">{review.user?.name || "Customer"}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-mocha/45">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                      <StarRating rating={review.rating} size={16} />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-mocha/75">{review.comment}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[28px] border border-dashed border-caramel/30 bg-latte/20 p-8 text-center">
                <MessageSquare size={26} className="mx-auto text-caramel" />
                <p className="mt-4 text-lg font-semibold text-cocoa">No reviews yet</p>
                <p className="mt-2 text-sm leading-6 text-mocha/70">Be the first customer to rate this party accessory.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
