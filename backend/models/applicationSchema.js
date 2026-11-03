import mongoose from "mongoose";
import validator from "validator";
import { APPLICATION_STATUSES } from "../utils/constants.js";

const resumeSchema = new mongoose.Schema(
  {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    storage: { type: String },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      required: true,
    },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String, maxLength: 500 },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    applicantID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    employerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Please enter your name."],
      trim: true,
      minLength: [3, "Name must contain at least 3 characters."],
      maxLength: [60, "Name cannot exceed 60 characters."],
    },
    email: {
      type: String,
      required: [true, "Please enter your email."],
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email."],
    },
    phone: {
      type: String,
      required: [true, "Please enter your phone number."],
      trim: true,
      maxLength: 20,
    },
    address: {
      type: String,
      required: [true, "Please enter your address."],
      trim: true,
      maxLength: 250,
    },
    coverLetter: {
      type: String,
      required: [true, "Please provide a cover letter."],
      trim: true,
      minLength: [20, "Cover letter must contain at least 20 characters."],
      maxLength: [4000, "Cover letter cannot exceed 4000 characters."],
    },
    resume: {
      type: resumeSchema,
      required: true,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "pending",
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    employerNote: {
      type: String,
      trim: true,
      maxLength: 1000,
      default: "",
    },
    withdrawnAt: Date,
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, applicantID: 1 }, { unique: true });
applicationSchema.index({ employerID: 1, status: 1, createdAt: -1 });
applicationSchema.index({ applicantID: 1, createdAt: -1 });
applicationSchema.index({ createdAt: -1 });

export const Application = mongoose.model("Application", applicationSchema);
