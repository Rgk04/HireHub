import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken, clearToken } from "../utils/jwtToken.js";
import {
  assertEmail,
  assertObjectId,
  assertPassword,
  assertPhone,
  normalizeEmail,
  sanitizeUser,
  trimString,
} from "../utils/validate.js";
import { PUBLIC_ROLES, ROLES } from "../utils/constants.js";
import {
  deleteUploadedFile,
  IMAGE_TYPES,
  RESUME_TYPES,
  uploadFile,
} from "../utils/upload.js";
import { createNotification } from "../utils/notify.js";

const getSingleFile = (files, key) => {
  if (!files || !files[key]) return null;
  return Array.isArray(files[key]) ? files[key][0] : files[key];
};

const sanitizeStringArray = (value, { maxItems = 30, maxLength = 60 } = {}) => {
  if (!Array.isArray(value)) return undefined;
  const unique = new Set();
  for (const item of value) {
    const cleaned = trimString(item, maxLength);
    if (cleaned) unique.add(cleaned);
    if (unique.size >= maxItems) break;
  }
  return [...unique];
};

const sanitizeEducation = (value) => {
  if (!Array.isArray(value)) return undefined;
  return value
    .slice(0, 10)
    .map((item) => ({
      degree: trimString(item?.degree, 120),
      institution: trimString(item?.institution, 160),
      year: trimString(item?.year, 20),
      grade: trimString(item?.grade, 40),
    }))
    .filter((item) => item.degree || item.institution);
};

const sanitizeExperience = (value) => {
  if (!Array.isArray(value)) return undefined;
  return value
    .slice(0, 15)
    .map((item) => ({
      title: trimString(item?.title, 120),
      company: trimString(item?.company, 160),
      startDate: trimString(item?.startDate, 30),
      endDate: trimString(item?.current ? "" : item?.endDate, 30),
      current: Boolean(item?.current),
      description: trimString(item?.description, 1000),
    }))
    .filter((item) => item.title || item.company);
};

export const register = catchAsyncErrors(async (req, res, next) => {
  const name = trimString(req.body.name, 60);
  const email = normalizeEmail(req.body.email);
  const phone = trimString(req.body.phone, 20);
  const password = req.body.password;
  const role = req.body.role;

  if (!name || !email || !phone || !password || !role) {
    return next(new ErrorHandler("Please fill in all required fields.", 400));
  }
  if (name.length < 3) {
    return next(new ErrorHandler("Name must contain at least 3 characters.", 400));
  }
  if (!PUBLIC_ROLES.includes(role)) {
    return next(
      new ErrorHandler("Please select a valid role (Job Seeker or Employer).", 400)
    );
  }
  assertEmail(email);
  assertPhone(phone);
  assertPassword(password);

  const existing = await User.findOne({ email });
  if (existing) {
    return next(
      new ErrorHandler("An account with this email already exists.", 409)
    );
  }

  const user = await User.create({ name, email, phone, password, role });
  await createNotification({
    user: user._id,
    title: "Welcome to HireHub",
    message:
      role === ROLES.EMPLOYER
        ? "Complete your company profile and post your first job to start hiring."
        : "Complete your profile, upload a resume and start applying for jobs.",
    type: "system",
  });

  sendToken(user, 201, res, "Account created successfully.");
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;
  const requestedRole = req.body.role;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password.", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password.", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 401));
  }

  if (user.isBlocked) {
    return next(
      new ErrorHandler(
        "Your account has been blocked. Please contact the administrator.",
        403
      )
    );
  }

  if (requestedRole && user.role !== requestedRole) {
    return next(
      new ErrorHandler(
        "No account was found for this email with the selected role.",
        401
      )
    );
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendToken(user, 200, res, "Logged in successfully.");
});

export const logout = catchAsyncErrors(async (_req, res) => {
  clearToken(res, 200, "Logged out successfully.");
});

export const getUser = catchAsyncErrors(async (req, res, _next) => {
  const user = await User.findById(req.user._id).select("-password");
  res.status(200).json({
    success: true,
    user: sanitizeUser(user),
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;

  const name = req.body.name !== undefined ? trimString(req.body.name, 60) : undefined;
  const email =
    req.body.email !== undefined ? normalizeEmail(req.body.email) : undefined;
  const phone =
    req.body.phone !== undefined ? trimString(req.body.phone, 20) : undefined;

  if (name !== undefined) {
    if (name.length < 3) {
      return next(new ErrorHandler("Name must contain at least 3 characters.", 400));
    }
    user.name = name;
  }
  if (email !== undefined) {
    assertEmail(email);
    if (email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        return next(new ErrorHandler("This email is already in use.", 409));
      }
      user.email = email;
    }
  }
  if (phone !== undefined) {
    assertPhone(phone);
    user.phone = phone;
  }

  const profile = req.body.profile || {};
  const profileFields = [
    "headline",
    "bio",
    "location",
    "website",
    "linkedin",
    "github",
    "companyName",
    "companyWebsite",
    "companySize",
    "industry",
    "companyDescription",
  ];
  const limits = {
    headline: 160,
    bio: 1500,
    location: 120,
    website: 200,
    linkedin: 200,
    github: 200,
    companyName: 120,
    companyWebsite: 200,
    companySize: 60,
    industry: 120,
    companyDescription: 1500,
  };

  for (const field of profileFields) {
    if (profile[field] !== undefined) {
      user.profile[field] = trimString(profile[field], limits[field]);
    }
  }

  const skills = sanitizeStringArray(req.body.skills);
  if (skills !== undefined) user.skills = skills;

  const education = sanitizeEducation(req.body.education);
  if (education !== undefined) user.education = education;

  const experience = sanitizeExperience(req.body.experience);
  if (experience !== undefined) user.experience = experience;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: sanitizeUser(user),
  });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(
      new ErrorHandler("Please provide your current and new password.", 400)
    );
  }
  assertPassword(newPassword);

  const user = await User.findById(req.user._id).select("+password");
  const isMatched = await user.comparePassword(currentPassword);
  if (!isMatched) {
    return next(new ErrorHandler("Current password is incorrect.", 401));
  }
  if (currentPassword === newPassword) {
    return next(
      new ErrorHandler("New password must be different from the current password.", 400)
    );
  }

  user.password = newPassword;
  await user.save();

  sendToken(user, 200, res, "Password updated successfully.");
});

export const updateAvatar = catchAsyncErrors(async (req, res, next) => {
  const file = getSingleFile(req.files, "avatar");
  if (!file) {
    return next(new ErrorHandler("Please select an image to upload.", 400));
  }

  const previous = req.user.avatar;
  const uploaded = await uploadFile(file, {
    folder: "avatars",
    resourceType: "image",
    rules: IMAGE_TYPES,
  });

  req.user.avatar = uploaded;
  await req.user.save();

  if (previous?.public_id) {
    await deleteUploadedFile(previous.public_id, {
      resourceType: "image",
      storage: previous.storage,
    });
  }

  res.status(200).json({
    success: true,
    message: "Profile photo updated.",
    user: sanitizeUser(req.user),
  });
});

export const uploadResume = catchAsyncErrors(async (req, res, next) => {
  const file = getSingleFile(req.files, "resume");
  if (!file) {
    return next(new ErrorHandler("Please select a resume to upload.", 400));
  }

  const previous = req.user.resume;
  const uploaded = await uploadFile(file, {
    folder: "resumes",
    resourceType: "raw",
    rules: RESUME_TYPES,
  });

  req.user.resume = uploaded;
  await req.user.save();

  if (previous?.public_id) {
    await deleteUploadedFile(previous.public_id, {
      resourceType: "raw",
      storage: previous.storage,
    });
  }

  res.status(200).json({
    success: true,
    message: "Resume uploaded successfully.",
    resume: uploaded,
    user: sanitizeUser(req.user),
  });
});

export const deleteResume = catchAsyncErrors(async (req, res, _next) => {
  const previous = req.user.resume;
  if (!previous?.public_id) {
    return res.status(200).json({
      success: true,
      message: "No resume to remove.",
      user: sanitizeUser(req.user),
    });
  }

  req.user.resume = undefined;
  await req.user.save();
  await deleteUploadedFile(previous.public_id, {
    resourceType: "raw",
    storage: previous.storage,
  });

  res.status(200).json({
    success: true,
    message: "Resume removed.",
    user: sanitizeUser(req.user),
  });
});

export const getCandidateProfile = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "candidate");

  const candidate = await User.findOne({
    _id: req.params.id,
    role: ROLES.SEEKER,
  }).select(
    "name avatar profile skills education experience createdAt"
  );

  if (!candidate) {
    return next(new ErrorHandler("Candidate not found.", 404));
  }

  res.status(200).json({
    success: true,
    candidate: sanitizeUser(candidate),
  });
});
