import mongoose from "mongoose";
import {
  CURRENCIES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
} from "../utils/constants.js";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a job title."],
      trim: true,
      minLength: [3, "Title must contain at least 3 characters."],
      maxLength: [120, "Title cannot exceed 120 characters."],
    },
    description: {
      type: String,
      required: [true, "Please provide a job description."],
      trim: true,
      minLength: [30, "Description must contain at least 30 characters."],
      maxLength: [5000, "Description cannot exceed 5000 characters."],
    },
    category: {
      type: String,
      required: [true, "Please provide a category."],
      enum: {
        values: JOB_CATEGORIES,
        message: "Please select a valid category.",
      },
    },
    company: {
      type: String,
      required: [true, "Company name is required."],
      trim: true,
      maxLength: 120,
    },
    country: {
      type: String,
      required: [true, "Please provide a country."],
      trim: true,
      maxLength: 80,
    },
    city: {
      type: String,
      required: [true, "Please provide a city."],
      trim: true,
      maxLength: 80,
    },
    location: {
      type: String,
      required: [true, "Please provide a location."],
      trim: true,
      maxLength: 200,
    },
    employmentType: {
      type: String,
      enum: {
        values: EMPLOYMENT_TYPES,
        message: "Please select a valid employment type.",
      },
      default: "Full-time",
    },
    experienceLevel: {
      type: String,
      enum: {
        values: EXPERIENCE_LEVELS,
        message: "Please select a valid experience level.",
      },
      default: "Entry Level",
    },
    fixedSalary: {
      type: Number,
      min: [0, "Salary cannot be negative."],
    },
    salaryFrom: {
      type: Number,
      min: [0, "Salary cannot be negative."],
    },
    salaryTo: {
      type: Number,
      min: [0, "Salary cannot be negative."],
    },
    currency: {
      type: String,
      enum: CURRENCIES,
      default: "INR",
    },
    skills: {
      type: [String],
      default: [],
    },
    vacancies: {
      type: Number,
      min: 1,
      max: 10000,
      default: 1,
    },
    deadline: {
      type: Date,
      default: null,
    },
    expired: {
      type: Boolean,
      default: false,
    },
    jobPostedOn: {
      type: Date,
      default: Date.now,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

jobSchema.virtual("isActive").get(function () {
  const deadlinePassed = this.deadline && this.deadline.getTime() < Date.now();
  return !this.expired && !deadlinePassed;
});

jobSchema.index({ postedBy: 1, createdAt: -1 });
jobSchema.index({ category: 1 });
jobSchema.index({ city: 1 });
jobSchema.index({ employmentType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ expired: 1, deadline: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ title: "text", description: "text", company: "text", skills: "text" });

export const Job = mongoose.model("Job", jobSchema);
