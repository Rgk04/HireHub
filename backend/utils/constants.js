export const ROLES = Object.freeze({
  SEEKER: "Job Seeker",
  EMPLOYER: "Employer",
  ADMIN: "Admin",
});

export const PUBLIC_ROLES = [ROLES.SEEKER, ROLES.EMPLOYER];

export const APPLICATION_STATUSES = [
  "pending",
  "shortlisted",
  "rejected",
  "hired",
  "withdrawn",
];

export const EMPLOYER_STATUS_UPDATES = [
  "pending",
  "shortlisted",
  "rejected",
  "hired",
];

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Remote",
];

export const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior", "Lead"];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

export const JOB_CATEGORIES = [
  "Frontend Web Development",
  "Backend Development",
  "MERN Stack Development",
  "MEAN Stack Development",
  "Mobile App Development",
  "DevOps & Cloud",
  "Data Science & Analytics",
  "Artificial Intelligence",
  "Graphics & Design",
  "UI/UX Design",
  "Account & Finance",
  "Business Development",
  "Marketing & Sales",
  "Human Resources",
  "Video Animation",
  "Game Development",
  "Content Writing",
  "Data Entry",
  "Customer Support",
];

export const NOTIFICATION_TYPES = [
  "application",
  "status",
  "job",
  "system",
];
