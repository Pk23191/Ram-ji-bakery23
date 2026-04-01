import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import SectionHeader from "../components/SectionHeader";
import Seo from "../components/Seo";
import useProducts from "../hooks/useProducts";
import { categoryLabels } from "../data/site";

export default function PartyPage() {
  const categories = ["all", "balloons", "ribbons", "candles", "hats", "banners"];
  const [activeCategory, setActiveCategory] = useState("all");
  const { products, isLoading, error } = useProducts(activeCategory === "all" ? "" : activeCategory);

  const filteredProducts = useMemo(() => {
    const allowed = new Set(["balloons", "ribbons", "candles", "hats", "banners", "party"]);
    const list = Array.isArray(products) ? products : [];

    if (activeCategory === "all") {
      return list.filter((product) => allowed.has(product.category));
    }

    return list;
  }, [products, activeCategory]);

  return (
    <>
      <Seo
        title="Party Accessories"
        description="Shop party accessories from Ramji Bakery, including celebration hampers, candles and add-on decor."
        path="/party"
      />
      <section className="section-shell py-12 sm:py-16">
        <div className="overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-[#fff4e6] via-[#fff8f2] to-[#ffe2cf] px-6 py-10 shadow-soft sm:px-10">
          <SectionHeader
            eyebrow="Party accessories"
            title="Finish every celebration with easy add-ons"
            description="Pick the exact party category you need: balloons, ribbons, candles, hats, or banners."
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {categories.map((category) => {
            const label =
              category === "all"
                ? "All"
                : categoryLabels[category] || category;
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-cocoa text-cream shadow-soft"
                    : "border border-caramel/30 bg-white text-cocoa hover:bg-latte/40"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-mocha/60">
          Prices shown are final. No hidden charges.
        </p>

        {error ? (
          <div className="glass-panel mt-8 border border-rose/20 bg-rose/5 p-5 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <div className="glass-panel p-6 text-sm text-mocha/70">Loading party products...</div>
          ) : filteredProducts.length ? (
            filteredProducts.map((product) => <ProductCard key={product._id} product={product} />)
          ) : (
            <div className="glass-panel sm:col-span-2 xl:col-span-3 p-8 text-center text-sm text-mocha/70">
              No party accessories are available right now. Please check back soon.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
