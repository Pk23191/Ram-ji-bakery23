const express = require("express");
const { memoryUpload } = require("../utils/upload");
const { handleUploadError } = require("../controllers/uploadController");
const { validateProductInput } = require("../middleware/validateInput");
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const router = express.Router();
// Accept any file fields so frontend can send either `image` or `images`.
const uploadProductImages = memoryUpload.any();

function runProductUpload(req, res, next) {
  uploadProductImages(req, res, (error) => {
    if (error) {
      return handleUploadError(error, req, res, next);
    }

    return next();
  });
}

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/add", auth, adminMiddleware, runProductUpload, validateProductInput, createProduct);
router.post("/", auth, adminMiddleware, runProductUpload, validateProductInput, createProduct);
router.put("/:id", auth, adminMiddleware, runProductUpload, validateProductInput, updateProduct);
router.delete("/:id", auth, adminMiddleware, deleteProduct);

module.exports = router;
