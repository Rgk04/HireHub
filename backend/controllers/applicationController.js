import path from "path";
import fs from "fs";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import {
  assertEmail,
  assertObjectId,
  escapeRegex,
  normalizeEmail,
  parsePagination,
  trimString,
} from "../utils/validate.js";
import {
  EMPLOYER_STATUS_UPDATES,
  ROLES,
} from "../utils/constants.js";
import {
  deleteUploadedFile,
  localResumePath,
  RESUME_TYPES,
  uploadFile,
} from "../utils/upload.js";
import { createNotification } from "../utils/notify.js";

const getSingleFile = (files, key) => {
  if (!files || !files[key]) return null;
  return Array.isArray(files[key]) ? files[key][0] : files[key];
};

const applicationPopulate = [
  {
    path: "jobId",
    select:
      "title company category city country location employmentType experienceLevel fixedSalary salaryFrom salaryTo currency deadline expired jobPostedOn postedBy applicationsCount",
  },
  {
    path: "applicantID",
    select:
      "name email phone avatar profile skills education experience createdAt",
  },
  {
    path: "employerID",
    select: "name avatar profile.companyName profile.industry",
  },
];

const populateApplication = (query) =>
  query.populate(applicationPopulate);

const getStatusCounts = async (match) => {
  const rows = await Application.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = {
    total: 0,
    pending: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
    withdrawn: 0,
  };
  for (const row of rows) {
    counts[row._id] = row.count;
    counts.total += row.count;
  }
  return counts;
};

const getMonthlySeries = async (match) => {
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  since.setMonth(since.getMonth() - 5);

  const rows = await Application.aggregate([
    { $match: { ...match, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);
  const counts = new Map(rows.map((row) => [row._id, row.count]));

  const series = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    series.push({
      month: key,
      label: date.toLocaleString("en-US", { month: "short" }),
      count: counts.get(key) || 0,
    });
  }
  return series;
};

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const jobId = req.body.jobId;
  assertObjectId(jobId, "job");

  const job = await Job.findById(jobId);
  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  const deadlinePassed = job.deadline && job.deadline.getTime() < Date.now();
  if (job.expired || deadlinePassed) {
    return next(
      new ErrorHandler("This job is no longer accepting applications.", 400)
    );
  }

  const existing = await Application.findOne({
    jobId: job._id,
    applicantID: req.user._id,
  });
  if (existing) {
    return next(
      new ErrorHandler("You have already applied for this job.", 409)
    );
  }

  const name = trimString(req.body.name, 60) || req.user.name;
  const email = normalizeEmail(req.body.email) || req.user.email;
  const phone = trimString(req.body.phone, 20) || req.user.phone;
  const address = trimString(req.body.address, 250);
  const coverLetter = trimString(req.body.coverLetter, 4000);

  if (!name || !email || !phone || !address || !coverLetter) {
    return next(new ErrorHandler("Please fill in all application fields.", 400));
  }
  assertEmail(email);
  if (coverLetter.length < 20) {
    return next(
      new ErrorHandler("Cover letter must contain at least 20 characters.", 400)
    );
  }

  let resume = null;
  let uploadedPublicId = null;
  const resumeFile = getSingleFile(req.files, "resume");

  if (resumeFile) {
    resume = await uploadFile(resumeFile, {
      folder: "resumes",
      resourceType: "raw",
      rules: RESUME_TYPES,
    });
    uploadedPublicId = resume.public_id;
  } else if (req.user.resume?.url) {
    resume = {
      public_id: req.user.resume.public_id,
      url: req.user.resume.url,
      originalName: req.user.resume.originalName,
      mimeType: req.user.resume.mimeType,
      size: req.user.resume.size,
      storage: req.user.resume.storage,
    };
  }

  if (!resume) {
    return next(
      new ErrorHandler(
        "A resume is required. Upload one here or add it to your profile first.",
        400
      )
    );
  }

  try {
    const application = await Application.create({
      jobId: job._id,
      applicantID: req.user._id,
      employerID: job.postedBy,
      name,
      email,
      phone,
      address,
      coverLetter,
      resume,
      status: "pending",
      statusHistory: [
        { status: "pending", changedAt: new Date(), changedBy: req.user._id },
      ],
    });

    await Job.findByIdAndUpdate(job._id, { $inc: { applicationsCount: 1 } });

    await createNotification({
      user: job.postedBy,
      title: "New application received",
      message: `${name} applied for ${job.title}.`,
      type: "application",
      application: application._id,
      job: job._id,
    });

    const populated = await populateApplication(
      Application.findById(application._id)
    );

    res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      application: populated,
    });
  } catch (error) {
    if (uploadedPublicId) {
      await deleteUploadedFile(uploadedPublicId, {
        resourceType: "raw",
        storage: resume.storage,
      });
    }
    if (error.code === 11000) {
      return next(
        new ErrorHandler("You have already applied for this job.", 409)
      );
    }
    throw error;
  }
});

export const employerGetAllApplications = catchAsyncErrors(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 8);
  const match = { employerID: req.user._id };

  if (req.query.jobId) {
    assertObjectId(req.query.jobId, "job");
    match.jobId = req.query.jobId;
  }
  if (req.query.status && req.query.status !== "all") {
    match.status = req.query.status;
  }
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(trimString(req.query.q, 80)), "i");
    match.$or = [{ name: rx }, { email: rx }, { coverLetter: rx }];
  }

  const [applications, totalApplications, stats] = await Promise.all([
    populateApplication(Application.find(match))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(match),
    getStatusCounts({ employerID: req.user._id }),
  ]);

  res.status(200).json({
    success: true,
    applications,
    stats,
    totalApplications,
    totalPages: Math.max(1, Math.ceil(totalApplications / limit)),
    currentPage: page,
    limit,
  });
});

export const jobseekerGetAllApplications = catchAsyncErrors(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 8);
  const match = { applicantID: req.user._id };

  if (req.query.status && req.query.status !== "all") {
    match.status = req.query.status;
  }
  if (req.query.jobId) {
    assertObjectId(req.query.jobId, "job");
    match.jobId = req.query.jobId;
  }

  const [applications, totalApplications, stats] = await Promise.all([
    populateApplication(Application.find(match))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(match),
    getStatusCounts({ applicantID: req.user._id }),
  ]);

  res.status(200).json({
    success: true,
    applications,
    stats,
    totalApplications,
    totalPages: Math.max(1, Math.ceil(totalApplications / limit)),
    currentPage: page,
    limit,
  });
});

export const checkApplication = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.jobId, "job");

  const application = await Application.findOne({
    jobId: req.params.jobId,
    applicantID: req.user._id,
  }).select("_id status createdAt");

  res.status(200).json({
    success: true,
    applied: Boolean(application),
    application,
  });
});

const canAccessApplication = (application, user) => {
  if (user.role === ROLES.ADMIN) return true;
  if (application.applicantID.toString() === user._id.toString()) return true;
  if (application.employerID.toString() === user._id.toString()) return true;
  return false;
};

export const getSingleApplication = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "application");

  const application = await populateApplication(
    Application.findById(req.params.id)
  );
  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }
  if (!canAccessApplication(application, req.user)) {
    return next(
      new ErrorHandler("You are not authorized to view this application.", 403)
    );
  }

  res.status(200).json({ success: true, application });
});

export const updateApplicationStatus = catchAsyncErrors(
  async (req, res, next) => {
    assertObjectId(req.params.id, "application");
    const status = trimString(req.body.status, 20).toLowerCase();
    const note = trimString(req.body.note, 1000);

    if (!EMPLOYER_STATUS_UPDATES.includes(status)) {
      return next(
        new ErrorHandler(
          `Invalid status. Allowed values: ${EMPLOYER_STATUS_UPDATES.join(", ")}.`,
          400
        )
      );
    }

    const application = await Application.findById(req.params.id).populate(
      "jobId",
      "title company"
    );
    if (!application) {
      return next(new ErrorHandler("Application not found.", 404));
    }

    if (application.employerID.toString() !== req.user._id.toString()) {
      return next(
        new ErrorHandler("You are not authorized to update this application.", 403)
      );
    }

    if (application.status === "withdrawn") {
      return next(
        new ErrorHandler(
          "This application was withdrawn by the candidate and cannot be updated.",
          400
        )
      );
    }
    if (application.status === status) {
      return next(
        new ErrorHandler(`This application is already marked as ${status}.`, 400)
      );
    }

    application.status = status;
    if (note) application.employerNote = note;
    application.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user._id,
      note,
    });
    await application.save();

    const job = application.jobId;
    await createNotification({
      user: application.applicantID,
      title: "Application status updated",
      message: `Your application for ${job?.title || "a job"}${
        job?.company ? ` at ${job.company}` : ""
      } is now ${status}.`,
      type: "status",
      application: application._id,
      job: job?._id,
    });

    const populated = await populateApplication(
      Application.findById(application._id)
    );

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}.`,
      application: populated,
    });
  }
);

const withdraw = async (application, req) => {
  application.status = "withdrawn";
  application.withdrawnAt = new Date();
  application.statusHistory.push({
    status: "withdrawn",
    changedAt: new Date(),
    changedBy: req.user._id,
  });
  await application.save();

  await createNotification({
    user: application.employerID,
    title: "Application withdrawn",
    message: `${application.name} withdrew their application.`,
    type: "application",
    application: application._id,
    job: application.jobId,
  });
};

export const withdrawApplication = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "application");

  const application = await Application.findById(req.params.id);
  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }
  if (application.applicantID.toString() !== req.user._id.toString()) {
    return next(
      new ErrorHandler("You are not authorized to withdraw this application.", 403)
    );
  }
  if (!["pending", "shortlisted"].includes(application.status)) {
    return next(
      new ErrorHandler(
        "Only pending or shortlisted applications can be withdrawn.",
        400
      )
    );
  }

  await withdraw(application, req);

  res.status(200).json({
    success: true,
    message: "Application withdrawn successfully.",
  });
});

// Kept as an alias so older clients calling DELETE keep working safely.
export const jobseekerDeleteApplication = catchAsyncErrors(
  async (req, res, next) => {
    assertObjectId(req.params.id, "application");
    const application = await Application.findById(req.params.id);
    if (!application) {
      return next(new ErrorHandler("Application not found.", 404));
    }
    if (application.applicantID.toString() !== req.user._id.toString()) {
      return next(
        new ErrorHandler("You are not authorized to remove this application.", 403)
      );
    }
    if (application.status === "withdrawn") {
      return res.status(200).json({
        success: true,
        message: "Application is already withdrawn.",
      });
    }
    if (!["pending", "shortlisted"].includes(application.status)) {
      return next(
        new ErrorHandler(
          "Only pending or shortlisted applications can be withdrawn.",
          400
        )
      );
    }

    await withdraw(application, req);
    res.status(200).json({
      success: true,
      message: "Application withdrawn successfully.",
    });
  }
);

export const downloadResume = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "application");

  const application = await Application.findById(req.params.id).populate(
    "jobId",
    "title"
  );
  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }
  if (!canAccessApplication(application, req.user)) {
    return next(
      new ErrorHandler("You are not authorized to download this resume.", 403)
    );
  }

  const { public_id, url, storage, originalName } = application.resume || {};
  if (!url) {
    return next(new ErrorHandler("Resume file is not available.", 404));
  }

  if (storage === "local" || (!storage && public_id && !/^https?:/i.test(url))) {
    const filePath = localResumePath(public_id);
    if (!filePath || !fs.existsSync(filePath)) {
      return next(new ErrorHandler("Resume file could not be found.", 404));
    }
    return res.download(filePath, originalName || path.basename(filePath));
  }

  const attachmentUrl = url.includes("/upload/")
    ? url.replace("/upload/", "/upload/fl_attachment/")
    : url;

  return res.redirect(attachmentUrl);
});

export const getDashboardStats = catchAsyncErrors(async (req, res) => {
  if (req.user.role === ROLES.EMPLOYER) {
    const now = new Date();
    const employerMatch = { employerID: req.user._id };

    const [
      totalJobs,
      expiredJobs,
      statuses,
      recent,
      monthly,
      topJobs,
    ] = await Promise.all([
      Job.countDocuments({ postedBy: req.user._id }),
      Job.countDocuments({
        postedBy: req.user._id,
        $or: [{ expired: true }, { deadline: { $lt: now } }],
      }),
      getStatusCounts(employerMatch),
      populateApplication(
        Application.find(employerMatch).sort({ createdAt: -1 }).limit(6)
      ),
      getMonthlySeries(employerMatch),
      Application.aggregate([
        { $match: employerMatch },
        {
          $group: {
            _id: "$jobId",
            applications: { $sum: 1 },
            shortlisted: {
              $sum: { $cond: [{ $eq: ["$status", "shortlisted"] }, 1, 0] },
            },
            hired: {
              $sum: { $cond: [{ $eq: ["$status", "hired"] }, 1, 0] },
            },
          },
        },
        { $sort: { applications: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "jobs",
            localField: "_id",
            foreignField: "_id",
            as: "job",
          },
        },
        { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            jobId: "$_id",
            title: "$job.title",
            company: "$job.company",
            applications: 1,
            shortlisted: 1,
            hired: 1,
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      role: req.user.role,
      stats: {
        totalJobs,
        activeJobs: Math.max(0, totalJobs - expiredJobs),
        expiredJobs,
        totalApplicants: statuses.total,
        pending: statuses.pending,
        shortlisted: statuses.shortlisted,
        rejected: statuses.rejected,
        hired: statuses.hired,
        withdrawn: statuses.withdrawn,
        recentApplications: recent,
        monthly,
        topJobs,
      },
    });
  }

  const seekerMatch = { applicantID: req.user._id };
  const [statuses, savedUser, recent, monthly] = await Promise.all([
    getStatusCounts(seekerMatch),
    User.findById(req.user._id).select("savedJobs"),
    populateApplication(
      Application.find(seekerMatch).sort({ createdAt: -1 }).limit(6)
    ),
    getMonthlySeries(seekerMatch),
  ]);

  return res.status(200).json({
    success: true,
    role: req.user.role,
    stats: {
      totalApplications: statuses.total,
      pending: statuses.pending,
      shortlisted: statuses.shortlisted,
      rejected: statuses.rejected,
      hired: statuses.hired,
      withdrawn: statuses.withdrawn,
      savedJobs: savedUser?.savedJobs?.length || 0,
      recentApplications: recent,
      monthly,
    },
  });
});
