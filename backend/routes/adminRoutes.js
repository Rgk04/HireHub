import express from "express";
import {
  deleteAdminJob,
  deleteUser,
  getAdminJobs,
  getAdminStats,
  getUsers,
  toggleBlockUser,
} from "../controllers/adminController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

router.use(isAuthenticated, authorizeRoles(ROLES.ADMIN));

router.get("/stats", getAdminStats);
router.get("/users", getUsers);
router.put("/user/:id/block", toggleBlockUser);
router.delete("/user/:id", deleteUser);
router.get("/jobs", getAdminJobs);
router.delete("/job/:id", deleteAdminJob);

export default router;
