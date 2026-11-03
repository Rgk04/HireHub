import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { Job } from "../models/jobSchema.js";
import { Application } from "../models/applicationSchema.js";
import { Notification } from "../models/notificationSchema.js";
import {
  assertObjectId,
  escapeRegex,
  parsePagination,
  sanitizeUser,
  trimString,
} from "../utils/validate.js";
import { ROLES } from "../utils/constants.js";
import { removeJobCascade } from "./jobController.js";

export const getAdminStats = catchAsyncErrors(async (_req, res) => {
  const now = new Date();
  const [
    seekers,
    employers,
    admins,
    blockedUsers,
    totalJobs,
    expiredJobs,
    totalApplications,
    pendingApplications,
    hiredApplications,
    recentUsers,
    recentJobs,
    statusRows,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.SEEKER }),
    User.countDocuments({ role: ROLES.EMPLOYER }),
    User.countDocuments({ role: ROLES.ADMIN }),
    User.countDocuments({ isBlocked: true }),
    Job.countDocuments(),
    Job.countDocuments({
      $or: [{ expired: true }, { deadline: { $lt: now } }],
    }),
    Application.countDocuments(),
    Application.countDocuments({ status: "pending" }),
    Application.countDocuments({ status: "hired" }),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role isBlocked createdAt avatar"),
    Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title company city country expired deadline createdAt")
      .populate("postedBy", "name email profile.companyName"),
    Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const applicationStatuses = {
    pending: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
    withdrawn: 0,
  };
  for (const row of statusRows) {
    applicationStatuses[row._id] = row.count;
  }

  res.status(200).json({
    success: true,
    stats: {
      totalUsers: seekers + employers + admins,
      seekers,
      employers,
      admins,
      blockedUsers,
      totalJobs,
      activeJobs: Math.max(0, totalJobs - expiredJobs),
      expiredJobs,
      totalApplications,
      pendingApplications,
      hiredApplications,
      applicationStatuses,
      recentUsers,
      recentJobs,
    },
  });
});

export const getUsers = catchAsyncErrors(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10);
  const conditions = [];

  if (req.query.role && req.query.role !== "all") {
    conditions.push({ role: req.query.role });
  }
  if (req.query.status === "blocked") conditions.push({ isBlocked: true });
  if (req.query.status === "active") conditions.push({ isBlocked: false });
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(trimString(req.query.q, 80)), "i");
    conditions.push({
      $or: [
        { name: rx },
        { email: rx },
        { "profile.companyName": rx },
        { phone: rx },
      ],
    });
  }

  const filter = conditions.length ? { $and: conditions } : {};
  const [users, totalUsers] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    users: users.map(sanitizeUser),
    totalUsers,
    totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
    currentPage: page,
  });
});

export const toggleBlockUser = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "user");

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }
  if (user.role === ROLES.ADMIN) {
    return next(new ErrorHandler("Admin accounts cannot be blocked.", 403));
  }
  if (user._id.toString() === req.user._id.toString()) {
    return next(new ErrorHandler("You cannot block your own account.", 400));
  }

  user.isBlocked = !user.isBlocked;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: user.isBlocked
      ? "User account blocked."
      : "User account unblocked.",
    user: sanitizeUser(user),
  });
});

export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "user");

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }
  if (user.role === ROLES.ADMIN) {
    return next(new ErrorHandler("Admin accounts cannot be deleted here.", 403));
  }
  if (user._id.toString() === req.user._id.toString()) {
    return next(new ErrorHandler("You cannot delete your own account.", 400));
  }

  if (user.role === ROLES.EMPLOYER) {
    const jobs = await Job.find({ postedBy: user._id });
    for (const job of jobs) {
      await removeJobCascade(job);
    }
    await Application.deleteMany({ employerID: user._id });
  } else {
    const applications = await Application.find({ applicantID: user._id }).select(
      "_id jobId"
    );
    const applicationIds = applications.map((item) => item._id);
    await Application.deleteMany({ applicantID: user._id });
    await Notification.deleteMany({
      $or: [
        { user: user._id },
        { application: { $in: applicationIds } },
      ],
    });
    for (const application of applications) {
      await Job.updateOne(
        { _id: application.jobId, applicationsCount: { $gt: 0 } },
        { $inc: { applicationsCount: -1 } }
      );
    }
  }

  await Notification.deleteMany({ user: user._id });
  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User account and related records deleted.",
  });
});

export const getAdminJobs = catchAsyncErrors(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10);
  const conditions = [];
  const now = new Date();

  if (req.query.status === "active") {
    conditions.push({ expired: false });
    conditions.push({
      $or: [
        { deadline: null },
        { deadline: { $exists: false } },
        { deadline: { $gte: now } },
      ],
    });
  } else if (req.query.status === "expired") {
    conditions.push({
      $or: [{ expired: true }, { deadline: { $lt: now } }],
    });
  }
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(trimString(req.query.q, 80)), "i");
    conditions.push({
      $or: [
        { title: rx },
        { company: rx },
        { city: rx },
        { country: rx },
        { category: rx },
      ],
    });
  }

  const filter = conditions.length ? { $and: conditions } : {};
  const [jobs, totalJobs] = await Promise.all([
    Job.find(filter)
      .populate("postedBy", "name email profile.companyName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    jobs,
    totalJobs,
    totalPages: Math.max(1, Math.ceil(totalJobs / limit)),
    currentPage: page,
  });
});

export const deleteAdminJob = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "job");

  const job = await Job.findById(req.params.id);
  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  await removeJobCascade(job);

  res.status(200).json({
    success: true,
    message: "Job listing removed from the platform.",
  });
});
