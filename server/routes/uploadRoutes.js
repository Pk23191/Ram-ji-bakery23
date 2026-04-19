const express = require("express");
const { memoryUpload } = require("../utils/upload");
const { uploadImages, uploadSingleImage, handleUploadError } = require("../controllers/uploadController");

const router = express.Router();

router.post("/products", (req, res, next) => {
  memoryUpload.array("images", 4)(req, res, (error) => {
    if (error) {
      return handleUploadError(error, req, res, next);
    }

    return uploadImages(req, res, next);
  });
});

router.post("/single", (req, res, next) => {
  memoryUpload.single("image")(req, res, (error) => {
    if (error) {
      return handleUploadError(error, req, res, next);
    }

    return uploadSingleImage(req, res, next);
  });
});

module.exports = router;
