const path = require("path");
const { readJson, writeJson } = require("../utils/fileStore");
const { uploadImageBuffer, getCloudinaryConfigError } = require("../config/cloudinary");

const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");
const CACHE_TTL_MS = 30 * 1000;
let cachedProducts = null;
let cachedAt = 0;

function setProductCache(products) {
  cachedProducts = Array.isArray(products) ? products : null;
  cachedAt = Date.now();
}

function getCachedProducts() {
  if (!cachedProducts) return null;
  if (Date.now() - cachedAt > CACHE_TTL_MS) {
    cachedProducts = null;
    return null;
  }
  return cachedProducts;
}

function normalizeCategory(category = "") {
  const value = String(category).trim().toLowerCase();

  if (["cake", "cakes"].includes(value)) return "cake";
  if (["pastry", "pastries", "bread", "breads"].includes(value)) return "pastry";
  if (["party", "birthday items", "birthday item", "birthday", "decor"].includes(value)) return "party";
  if (["balloon", "balloons"].includes(value)) return "balloons";
  if (["ribbon", "ribbons"].includes(value)) return "ribbons";
  if (["candle", "candles"].includes(value)) return "candles";
  if (["hat", "hats"].includes(value)) return "hats";
  if (["banner", "banners"].includes(value)) return "banners";

  return value;
}

function getCategoryAliases(category) {
  switch (category) {
    case "cake":
      return ["cake", "cakes", "Cake", "Cakes"];
    case "pastry":
      return ["pastry", "pastries", "bread", "breads", "Pastry", "Pastries", "Bread", "Breads"];
    case "party":
      return [
        "party",
        "birthday items",
        "birthday item",
        "birthday",
        "decor",
        "Party",
        "Birthday Items",
        "Birthday Item",
        "Birthday",
        "Decor"
      ];
    case "balloons":
      return ["balloons", "balloon", "Balloons", "Balloon"];
    case "ribbons":
      return ["ribbons", "ribbon", "Ribbons", "Ribbon"];
    case "candles":
      return ["candles", "candle", "Candles", "Candle"];
    case "hats":
      return ["hats", "hat", "Hats", "Hat"];
    case "banners":
      return ["banners", "banner", "Banners", "Banner"];
    default:
      return [];
  }
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

function parseMultiValue(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [trimmed];
    } catch (error) {
      return [trimmed];
    }
  }

  return [];
}

async function uploadFilesToCloudinary(req, files = []) {
  try {
    const configError = getCloudinaryConfigError();
    if (configError) {
      throw new Error(configError);
    }

    if (!Array.isArray(files) || !files.length) return [];

    const uploaded = await Promise.all(
      files.map((file, index) =>
        uploadImageBuffer(file.buffer, {
          public_id: `product-${Date.now()}-${index + 1}`,
          folder: "ramji-bakery/products",
          transformation: [{ width: 400, crop: "scale", quality: "auto" }]
        })
      )
    );

    return uploaded.map((a) => a && a.secure_url).filter(Boolean);
  } catch (error) {
    throw error;
  }
}

function normalizeProductPayload(body = {}, options = {}) {
  const {
    uploadedImages = [],
    existingImages = []
  } = options;
  const imageUrls = parseMultiValue(body.imageUrls)
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
  const keptImages = existingImages
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
  const normalizedImages = [...keptImages, ...uploadedImages, ...imageUrls].filter(Boolean).slice(0, 4);
  const colors = parseList(body.colors)
    .map((entry) => ({
      name: String(entry?.name || "").trim(),
      image: String(entry?.image || "").trim()
    }))
    .filter((entry) => entry.name && entry.image);

  return {
    ...body,
    category: normalizeCategory(body.category),
    // Ensure stored images are full URLs when possible to avoid broken links in production.
    image: (normalizedImages[0] && makeAbsoluteUrl(normalizedImages[0])) || "",
    images: normalizedImages.map((i) => makeAbsoluteUrl(i)),
    colors,
    description: body.description || "",
    price: Number(body.price),
    discountPercent: Math.min(Math.max(Number(body.discountPercent || 0), 0), 90),
    badge: body.badge || "Admin Added",
    rating: Number(body.rating || 4.7)
  };
}

function makeAbsoluteUrl(value = "") {
  const s = String(value || "").trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;

  // If it's a relative uploads path, prefix with BACKEND_URL or PUBLIC_API_URL (without /api)
  const backend = process.env.BACKEND_URL || process.env.PUBLIC_API_URL || "";
  const backendRoot = String(backend).replace(/\/(?:api)?\/?$/, "").replace(/\/$/, "");
  if (s.startsWith("/uploads") || s.startsWith("uploads")) {
    return backendRoot ? `${backendRoot}${s.startsWith("/") ? s : `/${s}`}` : s;
  }

  // Otherwise, return as-is (could be a data URL or external hostless path)
  return s;
}

async function getProducts(req, res) {
  try {
    const category = normalizeCategory(req.query.category);
    const cached = getCachedProducts();
    const products = cached || (await readJson(PRODUCTS_FILE, []));
    if (!cached) {
      setProductCache(products);
    }
    // Fix stored image URLs that point to localhost so deployed site shows images.
    const apiRoot = (process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}/api`).replace(/\/api\/?$/, "").replace(/\/$/, "");
    const fixedProducts = products.map((product) => {
      const p = { ...product };
      const fixUrl = (val) => {
        if (!val) return val;
        try {
          const s = String(val).trim();

          // If absolute URL, only rewrite localhost/hosted-api paths to apiRoot.
          if (/^https?:\/\//i.test(s)) {
            try {
              const parsed = new URL(s);
              const hostHeader = req.get("host") || "";
              const isLocalHost = /localhost|127\.0\.0\.1/i.test(parsed.hostname) || parsed.host === hostHeader;
              if (isLocalHost) {
                return `${apiRoot}/${parsed.pathname.replace(/^\/+/, "")}${parsed.search || ""}`;
              }
              // External URLs (e.g., Cloudinary) should be returned unchanged.
              return s;
            } catch (e) {
              return s;
            }
          }

          // If it's a relative uploads path, prefix with apiRoot
          if (s.startsWith("/uploads") || s.startsWith("uploads")) {
            return `${apiRoot}/${s.replace(/^\/+/, "")}`;
          }

          return s;
        } catch (e) {
          return val;
        }
      };

      p.image = fixUrl(p.image);
      p.images = Array.isArray(p.images) ? p.images.map(fixUrl) : p.images;
      return p;
    });
    const filtered = category
      ? fixedProducts.filter((product) => getCategoryAliases(category).includes(product.category))
      : fixedProducts;

    return res.json(filtered);
  } catch (error) {
    console.error("Get products failed:", error);
    return res.status(500).json({ message: "Unable to load products" });
  }
}

async function getProductById(req, res) {
  try {
    const products = await readJson(PRODUCTS_FILE, []);
    const product = products.find((item) => String(item._id) === String(req.params.id));

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product) {
      const apiRoot = (process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}/api`).replace(/\/api\/?$/, "").replace(/\/$/, "");
      const fixUrl = (val) => {
        if (!val) return val;
        const s = String(val).trim();

        if (/^https?:\/\//i.test(s)) {
          try {
            const parsed = new URL(s);
            const hostHeader = req.get("host") || "";
            const isLocalHost = /localhost|127\.0\.0\.1/i.test(parsed.hostname) || parsed.host === hostHeader;
            if (isLocalHost) {
              return `${apiRoot}/${parsed.pathname.replace(/^\/+/, "")}${parsed.search || ""}`;
            }

            return s;
          } catch (e) {
            return s;
          }
        }

        if (s.startsWith("/uploads") || s.startsWith("uploads")) {
          return `${apiRoot}/${s.replace(/^\/+/, "")}`;
        }

        return s;
      };

      const fixed = { ...product, image: fixUrl(product.image), images: Array.isArray(product.images) ? product.images.map(fixUrl) : product.images };
      return res.json(fixed);
    }
  } catch (error) {
    console.error("Get product failed:", error);
    return res.status(500).json({ message: "Unable to load product" });
  }
}

async function createProduct(req, res) {
  try {
    console.log("Create product payload:", {
      name: req.body?.name,
      category: req.body?.category,
      price: req.body?.price
    });
    // Debug: log uploaded files to help diagnose missing-image issues
    console.log("FILES:", Array.isArray(req.files) ? req.files.map(f => ({fieldname: f.fieldname, originalname: f.originalname, size: f.size})) : req.files);
    console.log("FILE:", req.file);
    const uploadedImages = await uploadFilesToCloudinary(req, req.files || []);
    const payload = normalizeProductPayload(req.body, {
      uploadedImages
    });

    if (!payload.images.length) {
      return res.status(400).json({ message: "Please add at least one product image." });
    }

    const products = await readJson(PRODUCTS_FILE, []);
    const product = {
      ...payload,
      _id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.unshift(product);
    await writeJson(PRODUCTS_FILE, products);
    setProductCache(products);

    return res.status(201).json(product);
  } catch (error) {
    console.error("Create product failed:", error);
    return res.status(500).json({ message: "Unable to save product" });
  }
}

async function updateProduct(req, res) {
  try {
    const products = await readJson(PRODUCTS_FILE, []);
    const index = products.findIndex((item) => String(item._id) === String(req.params.id));
    const currentProduct = index >= 0 ? products[index] : null;

    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const currentImages = parseMultiValue(req.body.existingImages);
    const uploadedImages = await uploadFilesToCloudinary(req, req.files || []);
    const payload = normalizeProductPayload(
      {
        ...(currentProduct.toObject ? currentProduct.toObject() : currentProduct),
        ...req.body
      },
      {
        uploadedImages,
        existingImages: currentImages.length ? currentImages : currentProduct.images || []
      }
    );

    if (!payload.images.length) {
      return res.status(400).json({ message: "Please keep or add at least one product image." });
    }

    const updatedProduct = {
      ...currentProduct,
      ...payload,
      updatedAt: new Date().toISOString()
    };
    products[index] = updatedProduct;
    await writeJson(PRODUCTS_FILE, products);
    setProductCache(products);

    return res.json(updatedProduct);
  } catch (error) {
    console.error("Update product failed:", error);
    return res.status(500).json({ message: "Unable to update product" });
  }
}

async function deleteProduct(req, res) {
  try {
    const products = await readJson(PRODUCTS_FILE, []);
    const index = products.findIndex((item) => String(item._id) === String(req.params.id));
    const product = index >= 0 ? products[index] : null;

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    products.splice(index, 1);
    await writeJson(PRODUCTS_FILE, products);
    setProductCache(products);

    return res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product failed:", error);
    return res.status(500).json({ message: "Unable to delete product" });
  }
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
