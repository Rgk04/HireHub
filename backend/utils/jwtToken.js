import config from "../config/env.js";
import { sanitizeUser } from "./validate.js";

const cookieOptions = () => ({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.cookieSameSite,
  path: "/",
  maxAge: config.cookieExpireDays * 24 * 60 * 60 * 1000,
});

export const sendToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions())
    .json({
      success: true,
      user: sanitizeUser(user),
      message,
    });
};

export const clearToken = (res, statusCode = 200, message = "Logged out successfully.") => {
  res
    .status(statusCode)
    .cookie("token", "", {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.cookieSameSite,
      path: "/",
      expires: new Date(0),
    })
    .json({ success: true, message });
};
