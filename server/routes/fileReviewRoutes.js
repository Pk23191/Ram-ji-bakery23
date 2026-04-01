const express = require("express");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const { addReview, getProductReviews } = require("../controllers/fileReviewController");

const router = express.Router();

router.post("/", auth, addReview);
router.get("/:productId", optionalAuth, getProductReviews);

module.exports = router;
