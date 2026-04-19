const express = require("express");
const { memoryUpload } = require("../utils/upload");
const { uploadImages, listImages, deleteImage } = require("../controllers/imageController");

const router = express.Router();

router.get("/", listImages);
router.post("/", memoryUpload.array("images", 4), uploadImages);
router.delete("/:id", deleteImage);

module.exports = router;
