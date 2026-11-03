import express from "express";
import {
  deleteJob,
  getAllJobs,
  getCategories,
  getLatestJobs,
  getMyJobs,
  getPublicStats,
  getRecommendedJobs,
  getRelatedJobs,
  getSavedJobs,
  getSingleJob,
  getTopCompanies,
  postJob,
  saveJob,
  unsaveJob,
  updateJob,
} from "../controllers/jobController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

router.get("/getall", getAllJobs);
router.get("/latest", getLatestJobs);
router.get("/public/stats", getPublicStats);
router.get("/categories", getCategories);
router.get("/companies", getTopCompanies);

router.get(
  "/recommended",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER),
  getRecommendedJobs
);
router.get(
  "/saved",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER),
  getSavedJobs
);
router.post(
  "/save/:id",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER),
  saveJob
);
router.delete(
  "/save/:id",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER),
  unsaveJob
);

router.post(
  "/post",
  isAuthenticated,
  authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN),
  postJob
);
router.get(
  "/getmyjobs",
  isAuthenticated,
  authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN),
  getMyJobs
);
router.put(
  "/update/:id",
  isAuthenticated,
  authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN),
  updateJob
);
router.delete(
  "/delete/:id",
  isAuthenticated,
  authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN),
  deleteJob
);

router.get("/:id/related", getRelatedJobs);
router.get("/:id", getSingleJob);

export default router;
