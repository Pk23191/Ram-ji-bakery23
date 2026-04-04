import Link from "next/link";
import useProducts from "../hooks/useProducts";
import ProductCard from "./ProductCard";
import SectionHeader from "./SectionHeader";

export default function FeaturedProducts() {
  const { products, error } = useProducts();

  // Log featured product for debugging image issues
  if (products && products.length > 0 && process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("Featured Product:", products[0]);
  }

  return (
    <section className="section-shell py-20">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          eyebrow="Featured selection"
          title="Designed for cravings, celebrations and gifting"
          description="Premium favorites curated to convert first-time visitors into repeat customers."
        />
        <Link href="/menu" className="btn-secondary">
          Explore Full Menu
        </Link>
      </div>
      {error ? (
        <div className="glass-panel border border-rose/20 bg-rose/5 p-5 text-sm text-rose-700">{error}</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <div key={product._id} className="rounded-2xl transition hover:scale-[1.02]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
