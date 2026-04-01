const express = require("express");
const upload = require("../utils/upload");
const { handleUploadError } = require("../controllers/uploadController");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const router = express.Router();
const uploadProductImages = upload.array("images", 4);

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
router.post("/add", runProductUpload, createProduct);
router.post("/", runProductUpload, createProduct);
router.put("/:id", runProductUpload, updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
