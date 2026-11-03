import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/env.js";
import { ROLES } from "../utils/constants.js";

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true, maxLength: 120 },
    institution: { type: String, trim: true, maxLength: 160 },
    year: { type: String, trim: true, maxLength: 20 },
    grade: { type: String, trim: true, maxLength: 40 },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxLength: 120 },
    company: { type: String, trim: true, maxLength: 160 },
    startDate: { type: String, trim: true, maxLength: 30 },
    endDate: { type: String, trim: true, maxLength: 30 },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, maxLength: 1000 },
  },
  { _id: true }
);

const fileSchema = new mongoose.Schema(
  {
    public_id: { type: String },
    url: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    storage: { type: String },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
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
      unique: true,
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
    password: {
      type: String,
      required: [true, "Please provide a password."],
      minLength: [8, "Password must contain at least 8 characters."],
      maxLength: [64, "Password cannot exceed 64 characters."],
      select: false,
    },
    role: {
      type: String,
      required: [true, "Please select a role."],
      enum: [ROLES.SEEKER, ROLES.EMPLOYER, ROLES.ADMIN],
      default: ROLES.SEEKER,
    },
    avatar: fileSchema,
    resume: fileSchema,
    profile: {
      headline: { type: String, trim: true, maxLength: 160 },
      bio: { type: String, trim: true, maxLength: 1500 },
      location: { type: String, trim: true, maxLength: 120 },
      website: { type: String, trim: true, maxLength: 200 },
      linkedin: { type: String, trim: true, maxLength: 200 },
      github: { type: String, trim: true, maxLength: 200 },
      companyName: { type: String, trim: true, maxLength: 120 },
      companyWebsite: { type: String, trim: true, maxLength: 200 },
      companySize: { type: String, trim: true, maxLength: 60 },
      industry: { type: String, trim: true, maxLength: 120 },
      companyDescription: { type: String, trim: true, maxLength: 1500 },
    },
    skills: {
      type: [String],
      default: [],
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    experience: {
      type: [experienceSchema],
      default: [],
    },
    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ "profile.companyName": 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

export const User = mongoose.model("User", userSchema);
