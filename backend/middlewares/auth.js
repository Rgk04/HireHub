import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import config from "../config/env.js";
import { ROLES } from "../utils/constants.js";

const extractToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return null;
};

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next(new ErrorHandler("Please log in to access this resource.", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return next(error);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new ErrorHandler("User account not found.", 401));
  }
  if (user.isBlocked) {
    return next(
      new ErrorHandler(
        "Your account has been blocked. Please contact the administrator.",
        403
      )
    );
  }

  req.user = user;
  next();
});

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ErrorHandler("Please log in to access this resource.", 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      new ErrorHandler(
        `Role (${req.user.role}) is not allowed to access this resource.`,
        403
      )
    );
  }
  next();
};

export const isAdmin = authorizeRoles(ROLES.ADMIN);
