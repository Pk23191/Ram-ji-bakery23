const multer = require("multer");

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
const allowedMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function imageOnly(req, file, cb) {
  if (!file.mimetype || !allowedMimeTypes.has(file.mimetype.toLowerCase())) {
    return cb(new Error("Only JPG, PNG and WebP image files are allowed."));
  }

  return cb(null, true);
}

// All uploads go to Cloudinary via memory buffer — no local disk storage needed.
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageOnly,
  limits: {
    fileSize: MAX_IMAGE_SIZE
  }
});

module.exports = memoryUpload;
module.exports.memoryUpload = memoryUpload;
module.exports.MAX_IMAGE_SIZE = MAX_IMAGE_SIZE;
