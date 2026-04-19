import { useEffect, useState } from "react";
import { normalizeProduct, products as fallbackCatalog } from "../data/site";
import api from "../utils/api";

export default function useProducts(category = "", options = {}) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError("");

    async function loadProducts() {
      try {
        const params = {};
        if (category) params.category = category;
        if (options.limit) params.limit = options.limit;
        if (options.page) params.page = options.page;

        const { data } = await api.get("/products", { params: Object.keys(params).length ? params : undefined });
        // If paginated response, normalize items
        const payload = Array.isArray(data) ? data : data?.items || [];
        let normalizedProducts = Array.isArray(data)
          ? data.map((product) => normalizeProduct(product))
          : payload.map((product) => normalizeProduct(product));

        if (!normalizedProducts.length) {
          normalizedProducts = fallbackCatalog.filter((product) => !category || product.category === category);

          if (options.limit) {
            const page = Number(options.page || 1);
            const start = (page - 1) * Number(options.limit);
            normalizedProducts = normalizedProducts.slice(start, start + Number(options.limit));
          }
        }

        if (active) {
          setProducts(normalizedProducts);
        }
      } catch (error) {
        console.error("Products API error:", error);
        let normalizedProducts = fallbackCatalog.filter((product) => !category || product.category === category);
        if (options.limit) {
          const page = Number(options.page || 1);
          const start = (page - 1) * Number(options.limit);
          normalizedProducts = normalizedProducts.slice(start, start + Number(options.limit));
        }

        const message = error?.response?.data?.message || "Live products are temporarily unavailable. Showing featured catalog.";
        if (active) {
          setProducts(normalizedProducts);
          setError(message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [category, options.limit, options.page]);

  return { products, isLoading, error };
}
