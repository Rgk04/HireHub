import mongoose from "mongoose";
import validator from "validator";
import ErrorHandler from "../middlewares/error.js";

export const assertObjectId = (id, label = "Resource") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid ${label} id.`, 400);
  }
};

export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeEmail = (value = "") =>
  String(value).trim().toLowerCase();

export const assertEmail = (email) => {
  if (!email || !validator.isEmail(email)) {
    throw new ErrorHandler("Please provide a valid email address.", 400);
  }
};

export const assertPhone = (phone) => {
  const cleaned = String(phone || "").trim();
  if (!/^\+?[0-9][0-9\s-]{6,18}$/.test(cleaned)) {
    throw new ErrorHandler("Please provide a valid phone number.", 400);
  }
};

export const assertPassword = (password) => {
  if (typeof password !== "string" || password.length < 8 || password.length > 64) {
    throw new ErrorHandler(
      "Password must contain between 8 and 64 characters.",
      400
    );
  }
};

export const trimString = (value, max = 500) =>
  String(value ?? "").trim().slice(0, max);

export const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parsePagination = (query, defaultLimit = 9) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit)
  );
  return { page, limit, skip: (page - 1) * limit };
};

export const sanitizeUser = (user) => {
  if (!user) return null;
  const plain =
    typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete plain.password;
  delete plain.__v;
  return plain;
};
