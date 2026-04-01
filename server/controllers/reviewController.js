const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");

function normalizeSort(sort = "latest") {
  return ["latest", "highest"].includes(sort) ? sort : "latest";
}

function sortReviews(reviews = [], sort = "latest") {
  const normalizedSort = normalizeSort(sort);
  const sorted = [...reviews];

  if (normalizedSort === "highest") {
    return sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || new Date(b.createdAt) - new Date(a.createdAt));
  }

  return sorted.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
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

function isValidProductIdentifier(productId) {
  if (!productId) {
    return false;
  }

  return mongoose.Types.ObjectId.isValid(productId);
}

async function addReview(req, res) {
  try {
    const { productId, rating, comment } = req.body;

    if (!req.user || req.user.role !== "customer") {
      return res.status(401).json({ message: "Only logged-in customers can add reviews" });
    }

    if (!isValidProductIdentifier(productId)) {
      return res.status(400).json({ message: "Valid productId is required" });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!comment?.trim()) {
      return res.status(400).json({ message: "Review comment is required" });
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const duplicate = await Review.findOne({ productId, userId: req.user.id });
    if (duplicate) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    const payload = {
      productId,
      userId: req.user.id,
      rating: numericRating,
      comment: comment.trim()
    };

    const review = await Review.create(payload);
    const responseReview = await Review.findById(review._id).populate("userId", "name");

    return res.status(201).json({
      message: "Review added successfully",
      review: {
        _id: responseReview._id,
        rating: responseReview.rating,
        comment: responseReview.comment,
        createdAt: responseReview.createdAt,
        user: {
          _id: responseReview.userId?._id,
          name: responseReview.userId?.name || "Customer"
        }
      }
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

    if (!isValidProductIdentifier(productId)) {
      return res.status(400).json({ message: "Valid productId is required" });
    }

    const reviews = await Review.find({ productId })
      .populate("userId", "name")
      .sort(sort === "highest" ? { rating: -1, createdAt: -1 } : { createdAt: -1 });

    const normalizedReviews = reviews.map((review) => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: {
        _id: review.userId?._id,
        name: review.userId?.name || "Customer"
      }
    }));

    const summary = buildReviewSummary(normalizedReviews);
    const hasReviewed = req.user?.role === "customer"
      ? normalizedReviews.some((review) => String(review.user?._id) === String(req.user.id))
      : false;

    return res.json({
      ...summary,
      hasReviewed,
      reviews: normalizedReviews
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
