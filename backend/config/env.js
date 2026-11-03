import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const missing = ["DB_URL", "JWT_SECRET_KEY"].filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(
      ", "
    )}. Copy backend/.env.example to backend/.env and configure it.`
  );
}

const port = Number(process.env.PORT) || 4000;

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || "";
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || "";

const looksLikePlaceholder = (value) =>
  !value || value.startsWith("your_") || value.startsWith("<");

export const config = {
  port,
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  dbUrl: process.env.DB_URL,
  dbName: process.env.DB_NAME || "hirehub",
  backendUrl:
    process.env.BACKEND_URL || `http://localhost:${port}`,
  frontendUrls: (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET_KEY,
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  cookieExpireDays: Number(process.env.COOKIE_EXPIRE) || 7,
  cookieSameSite: process.env.COOKIE_SAME_SITE || "lax",
  cloudinary: {
    cloudName: cloudinaryCloudName,
    apiKey: cloudinaryApiKey,
    apiSecret: cloudinaryApiSecret,
  },
  cloudinaryConfigured:
    !looksLikePlaceholder(cloudinaryCloudName) &&
    !looksLikePlaceholder(cloudinaryApiKey) &&
    !looksLikePlaceholder(cloudinaryApiSecret),
  admin: {
    name: process.env.ADMIN_NAME || "HireHub Administrator",
    email: (process.env.ADMIN_EMAIL || "admin@hirehub.com").toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "Admin@12345",
  },
};

export default config;
