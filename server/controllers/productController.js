const path = require("path");
const { readJson, writeJson } = require("../utils/fileStore");

const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");

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

function buildUploadedFileUrls(req, files = []) {
  return files.map((file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`);
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
    image: normalizedImages[0] || "",
    images: normalizedImages,
    colors,
    description: body.description || "",
    price: Number(body.price),
    discountPercent: Math.min(Math.max(Number(body.discountPercent || 0), 0), 90),
    badge: body.badge || "Admin Added",
    rating: Number(body.rating || 4.7)
  };
}

async function getProducts(req, res) {
  try {
    const category = normalizeCategory(req.query.category);
    const products = await readJson(PRODUCTS_FILE, []);
    const filtered = category
      ? products.filter((product) => getCategoryAliases(category).includes(product.category))
      : products;

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

    return res.json(product);
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
    const payload = normalizeProductPayload(req.body, {
      uploadedImages: buildUploadedFileUrls(req, req.files || [])
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
    const payload = normalizeProductPayload(
      {
        ...(currentProduct.toObject ? currentProduct.toObject() : currentProduct),
        ...req.body
      },
      {
        uploadedImages: buildUploadedFileUrls(req, req.files || []),
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

    return res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product failed:", error);
    return res.status(500).json({ message: "Unable to delete product" });
  }
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
