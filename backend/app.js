import "./config/env.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import helmet from "helmet";
import config from "./config/env.js";
import userRouter from "./routes/userRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import { errorMiddleware, notFound } from "./middlewares/error.js";
import ErrorHandler from "./middlewares/error.js";
import { sanitizeRequest } from "./middlewares/sanitize.js";
import { rateLimit } from "./middlewares/rateLimit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "uploads");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!config.isProduction || config.frontendUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new ErrorHandler("This origin is not allowed by CORS.", 403));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(sanitizeRequest);

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(process.cwd(), ".tmp-uploads"),
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
  })
);

app.use(
  "/uploads",
  express.static(uploadsDir, {
    maxAge: "1d",
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1500,
    message: "Too many requests from this address.",
  })
);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "HireHub API",
    environment: config.nodeEnv,
    uploads: config.cloudinaryConfigured ? "cloudinary" : "local",
    time: new Date().toISOString(),
  });
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/admin", adminRouter);

app.use(notFound);
app.use(errorMiddleware);

export default app;
