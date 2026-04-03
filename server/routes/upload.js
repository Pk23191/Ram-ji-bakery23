const express = require("express");
const router = express.Router();
const { memoryUpload } = require("../utils/upload");
const { uploadSingleImage, handleUploadError } = require("../controllers/uploadController");

router.post("/upload", (req, res, next) => {
  memoryUpload.single("image")(req, res, (error) => {
    if (error) return handleUploadError(error, req, res, next);
    return uploadSingleImage(req, res, next);
  });
});

// Alias: accept POST to '/api/upload' as well as '/api/upload/upload'
router.post("/", (req, res, next) => {
  memoryUpload.single("image")(req, res, (error) => {
    if (error) return handleUploadError(error, req, res, next);
    return uploadSingleImage(req, res, next);
  });
});

module.exports = router;