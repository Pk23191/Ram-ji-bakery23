const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "..", "uploads");
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB limit per requirements
const allowedMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png"]);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function sanitizeFileName(fileName = "image") {
  return String(fileName || "image")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.-]/g, "");
}

function imageOnly(req, file, cb) {
  if (!file.mimetype || !allowedMimeTypes.has(file.mimetype.toLowerCase())) {
    return cb(new Error("Only JPG and PNG image files are allowed."));
  }

  return cb(null, true);
}

const diskStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${sanitizeFileName(file.originalname)}`);
  }
});

const commonOptions = {
  fileFilter: imageOnly,
  limits: {
    fileSize: MAX_IMAGE_SIZE
  }
};

const diskUpload = multer({
  storage: diskStorage,
  ...commonOptions
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  ...commonOptions
});

module.exports = diskUpload;
module.exports.diskUpload = diskUpload;
module.exports.memoryUpload = memoryUpload;
module.exports.MAX_IMAGE_SIZE = MAX_IMAGE_SIZE;
