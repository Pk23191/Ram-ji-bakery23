import ProductCard from "../components/ProductCard";
import SectionHeader from "../components/SectionHeader";
import Seo from "../components/Seo";
import useProducts from "../hooks/useProducts";
import { formatCurrency } from "../utils/helpers";

export default function CakesPage() {
  const { products, isLoading, error } = useProducts("cake", { limit: 24, page: 1 });

  return (
    <>
      <Seo
        title="Cakes"
        description="Fresh cakes baked daily at Ramji Bakery. Choose classic, premium, and custom flavors."
        path="/cakes"
      />
      <section className="section-shell py-12 sm:py-16">
        <div className="overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-[#fff1e8] via-[#fff8f2] to-[#ffe2cf] px-6 py-10 shadow-soft sm:px-10">
          <SectionHeader
            eyebrow="Cakes"
            title="Fresh cakes for every celebration"
            description="All cakes include free delivery. Prices shown are final — no hidden charges."
          />
        </div>

        {error ? (
          <div className="glass-panel mt-8 border border-rose/20 bg-rose/5 p-5 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <div className="glass-panel p-6 text-sm text-mocha/70">Loading cakes...</div>
          ) : products.length ? (
            products.map((product) => <ProductCard key={product._id} product={product} />)
          ) : (
            <div className="glass-panel col-span-2 lg:col-span-4 p-8 text-center text-sm text-mocha/70">
              No cakes are available right now. Please check back soon.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
