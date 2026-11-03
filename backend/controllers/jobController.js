import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Job } from "../models/jobSchema.js";
import { Application } from "../models/applicationSchema.js";
import { Notification } from "../models/notificationSchema.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import {
  assertObjectId,
  escapeRegex,
  parsePagination,
  toNumber,
  trimString,
} from "../utils/validate.js";
import {
  CURRENCIES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
  ROLES,
} from "../utils/constants.js";

const activeJobConditions = (now = new Date()) => [
  { expired: false },
  {
    $or: [
      { deadline: null },
      { deadline: { $exists: false } },
      { deadline: { $gte: now } },
    ],
  },
];

const buildJobConditions = (query, { activeOnly = true } = {}) => {
  const conditions = [];
  const now = new Date();

  if (activeOnly) conditions.push(...activeJobConditions(now));

  const q = trimString(query.q, 100);
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    conditions.push({
      $or: [
        { title: rx },
        { description: rx },
        { company: rx },
        { category: rx },
        { city: rx },
        { country: rx },
        { location: rx },
        { skills: rx },
      ],
    });
  }

  if (query.category && query.category !== "All") {
    conditions.push({ category: query.category });
  }
  if (query.country) {
    conditions.push({ country: new RegExp(`^${escapeRegex(query.country)}$`, "i") });
  }
  if (query.city) {
    conditions.push({ city: new RegExp(escapeRegex(query.city), "i") });
  }
  if (query.location) {
    const rx = new RegExp(escapeRegex(query.location), "i");
    conditions.push({ $or: [{ city: rx }, { country: rx }, { location: rx }] });
  }
  if (query.employmentType && query.employmentType !== "All") {
    const types = String(query.employmentType)
      .split(",")
      .map((item) => item.trim())
      .filter((item) => EMPLOYMENT_TYPES.includes(item));
    if (types.length) conditions.push({ employmentType: { $in: types } });
  }
  if (query.experienceLevel && query.experienceLevel !== "All") {
    const levels = String(query.experienceLevel)
      .split(",")
      .map((item) => item.trim())
      .filter((item) => EXPERIENCE_LEVELS.includes(item));
    if (levels.length) conditions.push({ experienceLevel: { $in: levels } });
  }

  const minSalary = toNumber(query.minSalary);
  const maxSalary = toNumber(query.maxSalary);
  if (minSalary !== undefined) {
    conditions.push({
      $or: [
        { fixedSalary: { $gte: minSalary } },
        { salaryTo: { $gte: minSalary } },
        { salaryFrom: { $gte: minSalary } },
      ],
    });
  }
  if (maxSalary !== undefined) {
    conditions.push({
      $or: [
        { fixedSalary: { $lte: maxSalary } },
        { salaryFrom: { $lte: maxSalary } },
        { salaryTo: { $lte: maxSalary } },
      ],
    });
  }

  if (query.postedWithin) {
    const days = Number(query.postedWithin);
    if (Number.isFinite(days) && days > 0) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      conditions.push({ jobPostedOn: { $gte: since } });
    }
  }

  if (query.employer) {
    conditions.push({ postedBy: query.employer });
  }

  return conditions.length ? { $and: conditions } : {};
};

const getSort = (sort) => {
  switch (sort) {
    case "oldest":
      return { jobPostedOn: 1 };
    case "salary-high":
      return { fixedSalary: -1, salaryTo: -1, jobPostedOn: -1 };
    case "salary-low":
      return { fixedSalary: 1, salaryFrom: 1, jobPostedOn: -1 };
    case "popular":
      return { applicationsCount: -1, views: -1, jobPostedOn: -1 };
    case "newest":
    default:
      return { jobPostedOn: -1, createdAt: -1 };
  }
};

const populateEmployer = {
  path: "postedBy",
  select: "name avatar profile.companyName profile.industry profile.companySize profile.companyWebsite profile.companyDescription",
};

const decorateJob = (job) => {
  const plain = typeof job.toObject === "function" ? job.toObject() : job;
  return {
    ...plain,
    companyName:
      plain.company ||
      plain.postedBy?.profile?.companyName ||
      plain.postedBy?.name ||
      "Company",
  };
};

export const removeJobCascade = async (job) => {
  const jobId = job._id;
  const applications = await Application.find({ jobId }).select("_id");
  const applicationIds = applications.map((item) => item._id);

  await Application.deleteMany({ jobId });
  await Notification.deleteMany({
    $or: [{ job: jobId }, { application: { $in: applicationIds } }],
  });
  await User.updateMany({ savedJobs: jobId }, { $pull: { savedJobs: jobId } });
  await job.deleteOne();
};

export const getAllJobs = catchAsyncErrors(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 9);
  const conditions = buildJobConditions(req.query, { activeOnly: true });

  const [jobs, totalJobs] = await Promise.all([
    Job.find(conditions)
      .populate(populateEmployer)
      .sort(getSort(req.query.sort))
      .skip(skip)
      .limit(limit),
    Job.countDocuments(conditions),
  ]);

  res.status(200).json({
    success: true,
    jobs: jobs.map(decorateJob),
    totalJobs,
    totalPages: Math.max(1, Math.ceil(totalJobs / limit)),
    currentPage: page,
    limit,
  });
});

export const getLatestJobs = catchAsyncErrors(async (req, res) => {
  const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 6));
  const jobs = await Job.find(buildJobConditions({}, { activeOnly: true }))
    .populate(populateEmployer)
    .sort({ jobPostedOn: -1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    jobs: jobs.map(decorateJob),
  });
});

export const getPublicStats = catchAsyncErrors(async (_req, res) => {
  const now = new Date();
  const [openJobs, employers, seekers, applications, companies] =
    await Promise.all([
      Job.countDocuments({ $and: activeJobConditions(now) }),
      User.countDocuments({ role: ROLES.EMPLOYER, isBlocked: false }),
      User.countDocuments({ role: ROLES.SEEKER, isBlocked: false }),
      Application.countDocuments(),
      Job.distinct("company", { $and: activeJobConditions(now) }),
    ]);

  res.status(200).json({
    success: true,
    stats: {
      openJobs,
      employers,
      seekers,
      applications,
      companies: companies.filter(Boolean).length,
    },
  });
});

export const getCategories = catchAsyncErrors(async (_req, res) => {
  const now = new Date();
  const categories = await Job.aggregate([
    { $match: { $and: activeJobConditions(now) } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { _id: 0, name: "$_id", count: 1 } },
  ]);

  res.status(200).json({ success: true, categories });
});

export const getTopCompanies = catchAsyncErrors(async (_req, res) => {
  const now = new Date();
  const companies = await Job.aggregate([
    { $match: { $and: activeJobConditions(now) } },
    {
      $group: {
        _id: "$company",
        openPositions: { $sum: 1 },
        city: { $first: "$city" },
        country: { $first: "$country" },
        postedBy: { $first: "$postedBy" },
      },
    },
    { $sort: { openPositions: -1, _id: 1 } },
    { $limit: 6 },
    {
      $lookup: {
        from: "users",
        localField: "postedBy",
        foreignField: "_id",
        as: "employer",
      },
    },
    { $unwind: { path: "$employer", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        name: "$_id",
        openPositions: 1,
        location: 1,
        city: 1,
        country: 1,
        logo: "$employer.avatar.url",
        industry: "$employer.profile.industry",
      },
    },
  ]);

  res.status(200).json({ success: true, companies });
});

export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "job");

  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate(populateEmployer);

  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  res.status(200).json({ success: true, job: decorateJob(job) });
});

export const getRelatedJobs = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "job");
  const job = await Job.findById(req.params.id).select("category");
  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  const conditions = [
    ...activeJobConditions(new Date()),
    { category: job.category },
    { _id: { $ne: job._id } },
  ];

  const jobs = await Job.find({ $and: conditions })
    .populate(populateEmployer)
    .sort({ jobPostedOn: -1 })
    .limit(4);

  res.status(200).json({ success: true, jobs: jobs.map(decorateJob) });
});

export const getRecommendedJobs = catchAsyncErrors(async (req, res) => {
  const user = await User.findById(req.user._id).select("skills profile");
  const appliedJobIds = await Application.find({
    applicantID: req.user._id,
  }).distinct("jobId");

  const conditions = [
    ...activeJobConditions(new Date()),
    { _id: { $nin: appliedJobIds } },
  ];

  const skills = (user?.skills || []).filter(Boolean).slice(0, 10);
  if (skills.length) {
    conditions.push({ skills: { $in: skills } });
  } else {
    const headline = trimString(user?.profile?.headline, 80);
    if (headline) {
      conditions.push({
        $or: [
          { title: new RegExp(escapeRegex(headline), "i") },
          { category: new RegExp(escapeRegex(headline), "i") },
        ],
      });
    }
  }

  let jobs = await Job.find({ $and: conditions })
    .populate(populateEmployer)
    .sort({ jobPostedOn: -1 })
    .limit(6);

  if (jobs.length === 0) {
    jobs = await Job.find({
      $and: [...activeJobConditions(new Date()), { _id: { $nin: appliedJobIds } }],
    })
      .populate(populateEmployer)
      .sort({ jobPostedOn: -1 })
      .limit(6);
  }

  res.status(200).json({ success: true, jobs: jobs.map(decorateJob) });
});

const validateSalary = ({ fixedSalary, salaryFrom, salaryTo }) => {
  if (fixedSalary !== undefined && fixedSalary !== null) {
    if (salaryFrom !== undefined || salaryTo !== undefined) {
      throw new ErrorHandler(
        "Provide either a fixed salary or a salary range, not both.",
        400
      );
    }
    if (!Number.isFinite(fixedSalary) || fixedSalary < 0) {
      throw new ErrorHandler("Please provide a valid fixed salary.", 400);
    }
    return { fixedSalary, salaryFrom: undefined, salaryTo: undefined };
  }

  if (salaryFrom === undefined || salaryTo === undefined) {
    throw new ErrorHandler(
      "Please provide a fixed salary or a complete salary range.",
      400
    );
  }
  if (
    !Number.isFinite(salaryFrom) ||
    !Number.isFinite(salaryTo) ||
    salaryFrom < 0 ||
    salaryTo < 0
  ) {
    throw new ErrorHandler("Please provide a valid salary range.", 400);
  }
  if (salaryFrom > salaryTo) {
    throw new ErrorHandler(
      "Minimum salary cannot be greater than maximum salary.",
      400
    );
  }
  return { fixedSalary: undefined, salaryFrom, salaryTo };
};

export const postJob = catchAsyncErrors(async (req, res, next) => {
  const body = req.body;

  const title = trimString(body.title, 120);
  const description = trimString(body.description, 5000);
  const category = trimString(body.category, 120);
  const country = trimString(body.country, 80);
  const city = trimString(body.city, 80);
  const location = trimString(body.location, 200);
  const employmentType = trimString(body.employmentType, 40) || "Full-time";
  const experienceLevel = trimString(body.experienceLevel, 40) || "Entry Level";
  const currency = trimString(body.currency, 10) || "INR";

  if (!title || !description || !category || !country || !city || !location) {
    return next(new ErrorHandler("Please provide all required job details.", 400));
  }
  if (!JOB_CATEGORIES.includes(category)) {
    return next(new ErrorHandler("Please select a valid category.", 400));
  }
  if (!EMPLOYMENT_TYPES.includes(employmentType)) {
    return next(new ErrorHandler("Please select a valid employment type.", 400));
  }
  if (!EXPERIENCE_LEVELS.includes(experienceLevel)) {
    return next(new ErrorHandler("Please select a valid experience level.", 400));
  }
  if (!CURRENCIES.includes(currency)) {
    return next(new ErrorHandler("Please select a valid currency.", 400));
  }

  const fixedSalary = toNumber(body.fixedSalary);
  const salaryFrom = toNumber(body.salaryFrom);
  const salaryTo = toNumber(body.salaryTo);
  const salary = validateSalary({ fixedSalary, salaryFrom, salaryTo });

  let deadline = null;
  if (body.deadline) {
    deadline = new Date(body.deadline);
    if (Number.isNaN(deadline.getTime())) {
      return next(new ErrorHandler("Please provide a valid application deadline.", 400));
    }
    if (deadline.getTime() <= Date.now()) {
      return next(new ErrorHandler("Application deadline must be in the future.", 400));
    }
  }

  let skills = [];
  if (Array.isArray(body.skills)) {
    skills = [
      ...new Set(
        body.skills
          .map((item) => trimString(item, 40))
          .filter(Boolean)
          .slice(0, 20)
      ),
    ];
  } else if (typeof body.skills === "string") {
    skills = [
      ...new Set(
        body.skills
          .split(",")
          .map((item) => trimString(item, 40))
          .filter(Boolean)
          .slice(0, 20)
      ),
    ];
  }

  const vacancies = Math.min(
    10000,
    Math.max(1, Number.parseInt(body.vacancies, 10) || 1)
  );

  const employer = await User.findById(req.user._id).select("name profile");
  const company =
    trimString(body.company, 120) ||
    trimString(employer?.profile?.companyName, 120) ||
    employer?.name;

  const job = await Job.create({
    title,
    description,
    category,
    company,
    country,
    city,
    location,
    employmentType,
    experienceLevel,
    fixedSalary: salary.fixedSalary,
    salaryFrom: salary.salaryFrom,
    salaryTo: salary.salaryTo,
    currency,
    skills,
    vacancies,
    deadline,
    postedBy: req.user._id,
  });

  const populated = await Job.findById(job._id).populate(populateEmployer);

  res.status(201).json({
    success: true,
    message: "Job posted successfully.",
    job: decorateJob(populated),
  });
});

export const getMyJobs = catchAsyncErrors(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10);
  const now = new Date();

  const base = { postedBy: req.user._id };
  const status = req.query.status;
  const conditions = [{ postedBy: req.user._id }];

  if (status === "active") {
    conditions.push(...activeJobConditions(now));
  } else if (status === "expired") {
    conditions.push({
      $or: [{ expired: true }, { deadline: { $lt: now } }],
    });
  }

  if (req.query.q) {
    const rx = new RegExp(escapeRegex(trimString(req.query.q, 80)), "i");
    conditions.push({ $or: [{ title: rx }, { category: rx }, { city: rx }] });
  }

  const filter = { $and: conditions };
  const [jobs, totalJobs, expiredJobs, allJobs] = await Promise.all([
    Job.find(filter).sort({ jobPostedOn: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
    Job.countDocuments({
      ...base,
      $or: [{ expired: true }, { deadline: { $lt: now } }],
    }),
    Job.countDocuments(base),
  ]);

  const jobIds = jobs.map((job) => job._id);
  const counts = await Application.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    {
      $group: {
        _id: "$jobId",
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        shortlisted: {
          $sum: { $cond: [{ $eq: ["$status", "shortlisted"] }, 1, 0] },
        },
        hired: {
          $sum: { $cond: [{ $eq: ["$status", "hired"] }, 1, 0] },
        },
      },
    },
  ]);
  const countMap = new Map(counts.map((item) => [String(item._id), item]));

  const decorated = jobs.map((job) => {
    const count = countMap.get(String(job._id)) || {};
    return {
      ...decorateJob(job),
      applicantsCount: count.total || 0,
      pendingCount: count.pending || 0,
      shortlistedCount: count.shortlisted || 0,
      hiredCount: count.hired || 0,
    };
  });

  res.status(200).json({
    success: true,
    jobs: decorated,
    myJobs: decorated,
    totalJobs,
    totalPages: Math.max(1, Math.ceil(totalJobs / limit)),
    currentPage: page,
    stats: {
      total: allJobs,
      active: Math.max(0, allJobs - expiredJobs),
      expired: expiredJobs,
    },
  });
});

const applyJobUpdates = (job, body) => {
  const textFields = {
    title: 120,
    description: 5000,
    category: 120,
    country: 80,
    city: 80,
    location: 200,
    employmentType: 40,
    experienceLevel: 40,
    currency: 10,
    company: 120,
  };

  for (const [field, max] of Object.entries(textFields)) {
    if (body[field] !== undefined) {
      job[field] = trimString(body[field], max);
    }
  }

  if (body.employmentType && !EMPLOYMENT_TYPES.includes(job.employmentType)) {
    throw new ErrorHandler("Please select a valid employment type.", 400);
  }
  if (body.experienceLevel && !EXPERIENCE_LEVELS.includes(job.experienceLevel)) {
    throw new ErrorHandler("Please select a valid experience level.", 400);
  }
  if (body.currency && !CURRENCIES.includes(job.currency)) {
    throw new ErrorHandler("Please select a valid currency.", 400);
  }

  if (
    body.fixedSalary !== undefined ||
    body.salaryFrom !== undefined ||
    body.salaryTo !== undefined
  ) {
    const fixedSalary =
      body.fixedSalary !== undefined ? toNumber(body.fixedSalary) : undefined;
    const salaryFrom =
      body.salaryFrom !== undefined ? toNumber(body.salaryFrom) : undefined;
    const salaryTo =
      body.salaryTo !== undefined ? toNumber(body.salaryTo) : undefined;
    const salary = validateSalary({ fixedSalary, salaryFrom, salaryTo });
    job.fixedSalary = salary.fixedSalary;
    job.salaryFrom = salary.salaryFrom;
    job.salaryTo = salary.salaryTo;
  }

  if (body.skills !== undefined) {
    const raw = Array.isArray(body.skills)
      ? body.skills
      : String(body.skills).split(",");
    job.skills = [
      ...new Set(
        raw.map((item) => trimString(item, 40)).filter(Boolean).slice(0, 20)
      ),
    ];
  }

  if (body.vacancies !== undefined) {
    job.vacancies = Math.min(
      10000,
      Math.max(1, Number.parseInt(body.vacancies, 10) || 1)
    );
  }

  if (body.deadline !== undefined) {
    if (!body.deadline) {
      job.deadline = null;
    } else {
      const deadline = new Date(body.deadline);
      if (Number.isNaN(deadline.getTime())) {
        throw new ErrorHandler("Please provide a valid application deadline.", 400);
      }
      job.deadline = deadline;
      if (deadline.getTime() > Date.now() && body.expired === undefined) {
        job.expired = false;
      }
    }
  }

  if (body.expired !== undefined) {
    job.expired = body.expired === true || body.expired === "true";
  }
};

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "job");

  const job = await Job.findById(req.params.id);
  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  const isOwner = job.postedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    return next(
      new ErrorHandler("You are not authorized to edit this job listing.", 403)
    );
  }

  applyJobUpdates(job, req.body);
  await job.save();

  const populated = await Job.findById(job._id).populate(populateEmployer);

  res.status(200).json({
    success: true,
    message: "Job updated successfully.",
    job: decorateJob(populated),
  });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "job");

  const job = await Job.findById(req.params.id);
  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  const isOwner = job.postedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    return next(
      new ErrorHandler("You are not authorized to delete this job listing.", 403)
    );
  }

  await removeJobCascade(job);

  res.status(200).json({
    success: true,
    message: "Job and its applications were deleted.",
  });
});

export const saveJob = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "job");

  const now = new Date();
  const job = await Job.findOne({
    _id: req.params.id,
    $and: activeJobConditions(now),
  }).select("title");

  if (!job) {
    return next(new ErrorHandler("This job is no longer available.", 404));
  }

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { savedJobs: job._id },
  });

  const user = await User.findById(req.user._id).select("savedJobs");

  res.status(200).json({
    success: true,
    message: "Job saved to your favourites.",
    saved: true,
    savedJobsCount: user.savedJobs.length,
  });
});

export const unsaveJob = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "job");

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { savedJobs: req.params.id },
  });

  const user = await User.findById(req.user._id).select("savedJobs");

  res.status(200).json({
    success: true,
    message: "Job removed from saved jobs.",
    saved: false,
    savedJobsCount: user.savedJobs.length,
  });
});

export const getSavedJobs = catchAsyncErrors(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 9);
  const user = await User.findById(req.user._id).select("savedJobs");
  const ids = (user?.savedJobs || []).map(String);
  const totalJobs = ids.length;

  const pagedIds = ids.slice(skip, skip + limit);
  const jobs = await Job.find({ _id: { $in: pagedIds } }).populate(
    populateEmployer
  );
  const order = new Map(pagedIds.map((id, index) => [id, index]));
  jobs.sort((a, b) => order.get(String(a._id)) - order.get(String(b._id)));

  res.status(200).json({
    success: true,
    jobs: jobs.map(decorateJob),
    totalJobs,
    totalPages: Math.max(1, Math.ceil(totalJobs / limit)),
    currentPage: page,
    limit,
  });
});
