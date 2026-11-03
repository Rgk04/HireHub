import express from "express";
import {
  deleteResume,
  getCandidateProfile,
  getUser,
  login,
  logout,
  register,
  updateAvatar,
  updatePassword,
  updateProfile,
  uploadResume,
} from "../controllers/userController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: "Too many authentication attempts.",
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/logout", logout);
router.post("/logout", logout);

router.get("/getuser", isAuthenticated, getUser);
router.put("/profile", isAuthenticated, updateProfile);
router.put("/password", isAuthenticated, updatePassword);
router.post("/avatar", isAuthenticated, updateAvatar);
router.post("/resume", isAuthenticated, authorizeRoles(ROLES.SEEKER), uploadResume);
router.delete("/resume", isAuthenticated, authorizeRoles(ROLES.SEEKER), deleteResume);

router.get(
  "/candidate/:id",
  isAuthenticated,
  authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN),
  getCandidateProfile
);

export default router;
