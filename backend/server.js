import "./config/env.js";
import app from "./app.js";
import config from "./config/env.js";
import { connectDB } from "./database/dbConnection.js";

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      console.log(`HireHub API running at http://localhost:${config.port}`);
      console.log(
        `File storage: ${config.cloudinaryConfigured ? "Cloudinary" : "local backend/uploads"}`
      );
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} received. Closing server...`);
      server.close(() => process.exit(0));
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start HireHub API:", error.message);
    process.exit(1);
  }
};

startServer();
