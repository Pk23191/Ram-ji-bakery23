const path = require("path");
const { readJson, writeJson } = require("../utils/fileStore");

const REVIEWS_FILE = path.join(__dirname, "..", "data", "reviews.json");
const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");

function normalizeSort(sort = "latest") {
  return ["latest", "highest"].includes(sort) ? sort : "latest";
}

function buildReviewSummary(reviews = []) {
  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / totalReviews).toFixed(1))
    : 0;

  return {
    averageRating,
    totalReviews
  };
}

async function addReview(req, res) {
  try {
    const { productId, rating, comment } = req.body;

    if (!req.user || req.user.role !== "customer") {
      return res.status(401).json({ message: "Only logged-in customers can add reviews" });
    }

    if (!productId) {
      return res.status(400).json({ message: "Valid productId is required" });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!comment?.trim()) {
      return res.status(400).json({ message: "Review comment is required" });
    }

    const products = await readJson(PRODUCTS_FILE, []);
    const productExists = products.some((product) => String(product._id) === String(productId));
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = await readJson(REVIEWS_FILE, []);
    const duplicate = reviews.find(
      (review) => String(review.productId) === String(productId) && String(review.userId) === String(req.user.id)
    );
    if (duplicate) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    const review = {
      _id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productId,
      userId: req.user.id,
      rating: numericRating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      user: {
        _id: req.user.id,
        name: req.user.name || "Customer"
      }
    };

    reviews.unshift(review);
    await writeJson(REVIEWS_FILE, reviews);

    return res.status(201).json({
      message: "Review added successfully",
      review
    });
  } catch (error) {
    console.error("Add review failed:", error);
    return res.status(500).json({ message: "Unable to add review" });
  }
}

async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;
    const sort = normalizeSort(req.query.sort);

    if (!productId) {
      return res.status(400).json({ message: "Valid productId is required" });
    }

    const reviews = await readJson(REVIEWS_FILE, []);
    const productReviews = reviews.filter((review) => String(review.productId) === String(productId));
    const sorted = sort === "highest"
      ? [...productReviews].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      : [...productReviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const summary = buildReviewSummary(sorted);
    const hasReviewed = req.user?.role === "customer"
      ? sorted.some((review) => String(review.userId) === String(req.user.id))
      : false;

    return res.json({
      ...summary,
      hasReviewed,
      reviews: sorted
    });
  } catch (error) {
    console.error("Get reviews failed:", error);
    return res.status(500).json({ message: "Unable to load reviews" });
  }
}

module.exports = {
  addReview,
  getProductReviews
};
