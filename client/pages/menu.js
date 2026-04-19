import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import SectionHeader from "../components/SectionHeader";
import Seo from "../components/Seo";
import { categories, categoryLabels, normalizeCategory } from "../data/site";
import useProducts from "../hooks/useProducts";

export default function MenuPage() {
  const { products, isLoading, error } = useProducts("", { limit: 20, page: 1 });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "All" || normalizeCategory(product.category) === category;
        const matchesPrice =
          priceFilter === "All" ||
          (priceFilter === "Below 200" && product.price < 200) ||
          (priceFilter === "200-600" && product.price >= 200 && product.price <= 600) ||
          (priceFilter === "Above 600" && product.price > 600);

        return matchesSearch && matchesCategory && matchesPrice;
      }),
    [products, query, category, priceFilter]
  );

  return (
    <>
      <Seo
        title="Menu"
        description="Browse cakes, pastries and party accessories available for online ordering at Ramji Bakery."
        path="/menu"
      />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="Our menu"
          title="A bakery menu engineered for quick decisions"
          description="Search, filter and order from our best-selling categories in seconds."
        />

        <div className="glass-panel mt-10 grid gap-4 p-5 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="soft-input"
            placeholder="Search cakes, pastries, party accessories..."
          />
          <select className="soft-input" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? item : categoryLabels[item] || item}
              </option>
            ))}
          </select>
          <select className="soft-input" value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
            {["All", "Below 200", "200-600", "Above 600"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="glass-panel mt-8 border border-rose/20 bg-rose/5 p-5 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <div className="glass-panel p-6 text-sm text-mocha/70">Loading products...</div>
          ) : (
            filteredProducts.map((product) => <ProductCard key={product._id} product={product} />)
          )}
        </div>
      </section>
    </>
  );
}
