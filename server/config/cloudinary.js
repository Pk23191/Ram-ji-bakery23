const path = require("path");
const dotenv = require("dotenv");
const { v2: cloudinary } = require("cloudinary");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const REQUIRED_ENV_KEYS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];

function isPlaceholderValue(value = "") {
  const normalized = String(value || "").trim().toLowerCase();

  return [
    "",
    "your_cloud_name",
    "your_api_key",
    "your_api_secret",
    "replace_with_cloudinary_api_secret",
    "replace-with-cloudinary-api-secret",
    "********",
    "*************************"
  ].includes(normalized);
}

function getMissingCloudinaryEnv() {
  return REQUIRED_ENV_KEYS.filter((key) => isPlaceholderValue(process.env[key]));
}

function isCloudinaryConfigured() {
  return getMissingCloudinaryEnv().length === 0;
}

function getCloudinaryConfigError() {
  const missing = getMissingCloudinaryEnv();
  if (!missing.length) {
    return null;
  }

  return `Cloudinary is not configured. Add real values for: ${missing.join(", ")}.`;
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
} else {
  console.error("Cloudinary not configured");
}

function assertCloudinaryConfigured() {
  const errorMessage = getCloudinaryConfigError();
  if (errorMessage) {
    const error = new Error(errorMessage);
    error.statusCode = 500;
    throw error;
  }
}

async function uploadImageBuffer(buffer, options = {}) {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ramji-bakery/products",
        resource_type: "image",
        ...options
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      }
    );

    stream.end(buffer);
  });
}

async function uploadImageAsBase64(buffer, mimeType, options = {}) {
  assertCloudinaryConfigured();

  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  return cloudinary.uploader.upload(dataUri, {
    folder: "ramji-bakery/products",
    resource_type: "image",
    ...options
  });
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  getCloudinaryConfigError,
  assertCloudinaryConfigured,
  uploadImageBuffer,
  uploadImageAsBase64
};
