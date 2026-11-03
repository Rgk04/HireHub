import mongoose from "mongoose";
import { NOTIFICATION_TYPES } from "../utils/constants.js";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxLength: 600,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: "system",
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
