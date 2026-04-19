const mongoose = require("mongoose");
const Image = require("../models/Image");
const { cloudinary, uploadImageBuffer } = require("../config/cloudinary");

function ensureDbReady(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: "Database not connected" });
    return false;
  }
  return true;
}

function getRequestFiles(req) {
  if (Array.isArray(req.files)) return req.files;
  if (req.file) return [req.file];
  if (req.files && typeof req.files === "object") {
    return [...(req.files.images || []), ...(req.files.image || [])];
  }
  return [];
}

async function uploadImages(req, res) {
  try {
    if (!ensureDbReady(res)) return;

    const files = getRequestFiles(req).slice(0, 4);
    if (!files.length) {
      return res.status(400).json({ message: 'No image file uploaded. Use the "images" field.' });
    }

    const uploaded = await Promise.all(
      files.map((file, index) =>
        uploadImageBuffer(file.buffer, {
          folder: "ramji-bakery/uploads",
          public_id: `rb-upload-${Date.now()}-${index + 1}`
        })
      )
    );

    const docs = await Image.insertMany(
      uploaded.map((asset, idx) => ({
        url: asset.secure_url,
        publicId: asset.public_id,
        originalName: files[idx]?.originalname || ""
      }))
    );

    return res.status(201).json({
      message: "Images uploaded successfully",
      images: docs
    });
  } catch (error) {
    console.error("Image upload failed:", error);
    return res.status(500).json({ message: error.message || "Image upload failed" });
  }
}

async function listImages(req, res) {
  try {
    if (!ensureDbReady(res)) return;
    const images = await Image.find().sort({ createdAt: -1 }).lean();
    return res.json(images);
  } catch (error) {
    console.error("List images failed:", error);
    return res.status(500).json({ message: "Unable to load images" });
  }
}

async function deleteImage(req, res) {
  try {
    if (!ensureDbReady(res)) return;
    const image = await Image.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (image.publicId && cloudinary?.uploader) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (error) {
        console.error("Cloudinary delete failed:", error);
      }
    }

    return res.json({ message: "Image deleted", imageId: image._id });
  } catch (error) {
    console.error("Delete image failed:", error);
    return res.status(500).json({ message: "Unable to delete image" });
  }
}

module.exports = {
  uploadImages,
  listImages,
  deleteImage
};
