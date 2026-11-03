import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import config from "../config/env.js";
import ErrorHandler from "../middlewares/error.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

export const RESUME_TYPES = {
  extensions: [".pdf", ".doc", ".docx"],
  mimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maxSize: 5 * 1024 * 1024,
  label: "PDF, DOC or DOCX",
};

export const IMAGE_TYPES = {
  extensions: [".jpg", ".jpeg", ".png", ".webp"],
  mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSize: 2 * 1024 * 1024,
  label: "JPG, PNG or WEBP",
};

if (config.cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

const removeTempFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // Temp file may already be gone.
  }
};

const validateFile = (file, rules) => {
  if (!file) {
    throw new ErrorHandler("Please upload a file.", 400);
  }
  const extension = path.extname(file.name || "").toLowerCase();
  if (!rules.extensions.includes(extension)) {
    throw new ErrorHandler(
      `Invalid file type. Please upload a ${rules.label} file.`,
      400
    );
  }
  if (!rules.mimeTypes.includes(file.mimetype)) {
    throw new ErrorHandler(
      `Invalid file content type. Please upload a ${rules.label} file.`,
      400
    );
  }
  if (file.size > rules.maxSize) {
    throw new ErrorHandler(
      `File is too large. Maximum size is ${Math.round(
        rules.maxSize / (1024 * 1024)
      )} MB.`,
      400
    );
  }
};

/**
 * Uploads a file to Cloudinary when it is configured, otherwise stores it
 * locally under backend/uploads. The return shape matches Cloudinary so the
 * rest of the application does not need to care where the file lives.
 */
export const uploadFile = async (
  file,
  { folder = "resumes", resourceType = "raw", rules = RESUME_TYPES } = {}
) => {
  validateFile(file, rules);

  if (config.cloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: `hirehub/${folder}`,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      });
      return {
        public_id: result.public_id,
        url: result.secure_url,
        originalName: file.name,
        mimeType: file.mimetype,
        size: file.size,
        storage: "cloudinary",
      };
    } catch (error) {
      console.error("Cloudinary upload failed:", error.message);
      throw new ErrorHandler(
        "File upload failed. Please check your Cloudinary configuration and try again.",
        502
      );
    } finally {
      await removeTempFile(file.tempFilePath);
    }
  }

  const extension = path.extname(file.name).toLowerCase();
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "");
  const targetDir = path.join(UPLOADS_DIR, safeFolder);
  await fs.mkdir(targetDir, { recursive: true });

  const fileName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;
  const targetPath = path.join(targetDir, fileName);
  const tempPath = file.tempFilePath;

  try {
    await fs.copyFile(tempPath, targetPath);
  } finally {
    await removeTempFile(tempPath);
  }

  return {
    public_id: `${safeFolder}/${fileName}`,
    url: `${config.backendUrl}/uploads/${safeFolder}/${fileName}`,
    originalName: file.name,
    mimeType: file.mimetype,
    size: file.size,
    storage: "local",
  };
};

export const deleteUploadedFile = async (
  publicId,
  { resourceType = "raw", storage } = {}
) => {
  if (!publicId) return;
  try {
    const storedOnCloudinary =
      storage === "cloudinary" || (storage !== "local" && config.cloudinaryConfigured);
    if (storedOnCloudinary) {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return;
    }
    const normalized = path.normalize(publicId).replace(/^(\.\.(\/|\\|$))+/, "");
    const filePath = path.join(UPLOADS_DIR, normalized);
    if (!filePath.startsWith(UPLOADS_DIR)) return;
    await fs.unlink(filePath);
  } catch {
    // Best effort cleanup; a missing file must not block the request.
  }
};

export const localResumePath = (publicId = "") => {
  const normalized = path.normalize(publicId).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(UPLOADS_DIR, normalized);
  return filePath.startsWith(UPLOADS_DIR) ? filePath : null;
};
