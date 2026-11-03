
import mongoose from "mongoose";
import config from "../config/env.js";
import dns from "node:dns";

// Use Google DNS for MongoDB Atlas SRV resolution
dns.setServers(["8.8.8.8", "8.8.4.4"]);

export const connectDB = async () => {
  try {
    await mongoose.connect(config.dbUrl, {
      dbName: config.dbName,
      serverSelectionTimeoutMS: 15000,
    });

    console.log(`MongoDB connected (${config.dbName})`);
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
};

export default connectDB;
