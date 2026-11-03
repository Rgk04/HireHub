import express from "express";
import {
  checkApplication,
  downloadResume,
  employerGetAllApplications,
  getDashboardStats,
  getSingleApplication,
  jobseekerDeleteApplication,
  jobseekerGetAllApplications,
  postApplication,
  updateApplicationStatus,
  withdrawApplication,
} from "../controllers/applicationController.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

router.post(
  "/post",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER),
  postApplication
);

router.get(
  "/employer/getall",
  isAuthenticated,
  authorizeRoles(ROLES.EMPLOYER),
  employerGetAllApplications
);
router.get(
  "/jobseeker/getall",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER),
  jobseekerGetAllApplications
);

router.get(
  "/stats",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER, ROLES.EMPLOYER),
  getDashboardStats
);

router.get(
  "/check/:jobId",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER),
  checkApplication
);

router.put(
  "/status/:id",
  isAuthenticated,
  authorizeRoles(ROLES.EMPLOYER),
  updateApplicationStatus
);

router.put(
  "/withdraw/:id",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER),
  withdrawApplication
);

router.delete(
  "/delete/:id",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER),
  jobseekerDeleteApplication
);

router.get(
  "/:id/resume",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER, ROLES.EMPLOYER, ROLES.ADMIN),
  downloadResume
);

router.get(
  "/:id",
  isAuthenticated,
  authorizeRoles(ROLES.SEEKER, ROLES.EMPLOYER, ROLES.ADMIN),
  getSingleApplication
);

export default router;
