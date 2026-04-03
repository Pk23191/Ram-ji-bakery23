const multer = require("multer");
const {
  getCloudinaryConfigError,
  uploadImageAsBase64,
  uploadImageBuffer
} = require("../config/cloudinary");

function getRequestFiles(req) {
  if (Array.isArray(req.files)) {
    return req.files;
  }

  if (req.files && typeof req.files === "object") {
    return [...(req.files.image || []), ...(req.files.images || [])];
  }

  if (req.file) {
    return [req.file];
  }

  return [];
}

async function uploadImages(req, res) {
  try {
    const configError = getCloudinaryConfigError();
    if (configError) {
      return res.status(500).json({
        message: `${configError} Image upload is blocked until Cloudinary is fully configured in server/.env.`
      });
    }

    const files = getRequestFiles(req).slice(0, 4);
    if (!files.length) {
      return res.status(400).json({ message: 'No image file uploaded. Use the "image" field.' });
    }

    const uploadedAssets = await Promise.all(
      files.map((file, index) =>
        uploadImageBuffer(file.buffer, {
          folder: "ramji-bakery/products",
          public_id: `product-${Date.now()}-${index + 1}`
        })
      )
    );

    const urls = uploadedAssets.map((asset) => asset.secure_url).filter(Boolean);

    return res.status(200).json({
      message: "Images uploaded successfully.",
      urls,
      url: urls[0] || ""
    });
  } catch (error) {
    console.error("uploadImages error:", error);
    return res.status(500).json({
      message: error.message || "Image upload failed."
    });
  }
}

async function uploadSingleImage(req, res) {
  try {
    const configError = getCloudinaryConfigError();
    if (configError) {
      return res.status(500).json({
        message: `${configError} Image upload is blocked until Cloudinary is fully configured in server/.env.`
      });
    }

    const file = getRequestFiles(req)[0] || req.file;

    if (!file) {
      return res.status(400).json({ message: 'No image file selected. Use the "image" field.' });
    }

    const uploadedAsset = await uploadImageAsBase64(file.buffer, file.mimetype, {
      public_id: `single-upload-${Date.now()}`
    });

    return res.status(200).json({
      message: "Image uploaded successfully.",
      secure_url: uploadedAsset.secure_url,
      url: uploadedAsset.secure_url
    });
  } catch (error) {
    console.error("uploadSingleImage error:", error);
    return res.status(500).json({
      message: error.message || "Image upload failed."
    });
  }
}

function handleUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Each image must be 2MB or smaller." });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: `Unexpected field "${error.field}". Please upload using "image" or "images".`
      });
    }

    return res.status(400).json({ message: error.message });
  }

  if (error) {
    return res.status(400).json({ message: error.message || "Invalid upload request." });
  }

  return next();
}

module.exports = {
  uploadSingleImage,
  uploadImages,
  uploadProductImages: uploadImages,
  handleUploadError
};
