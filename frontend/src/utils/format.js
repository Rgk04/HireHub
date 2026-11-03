const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
};

const numberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const formatAmount = (value) =>
  value === undefined || value === null || value === ""
    ? ""
    : numberFormatter.format(Number(value));

export const formatSalary = (job = {}) => {
  const symbol = CURRENCY_SYMBOLS[job.currency] || `${job.currency || ""} `;
  if (job.fixedSalary) {
    return `${symbol}${formatAmount(job.fixedSalary)} / year`;
  }
  if (job.salaryFrom && job.salaryTo) {
    return `${symbol}${formatAmount(job.salaryFrom)} – ${symbol}${formatAmount(
      job.salaryTo
    )} / year`;
  }
  if (job.salaryFrom) return `From ${symbol}${formatAmount(job.salaryFrom)}`;
  if (job.salaryTo) return `Up to ${symbol}${formatAmount(job.salaryTo)}`;
  return "Salary not disclosed";
};

export const timeAgo = (date) => {
  if (!date) return "Recently";
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return "Recently";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

export const formatDate = (date, options = {}) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
};

export const formatDateTime = (date) =>
  formatDate(date, { hour: "2-digit", minute: "2-digit" });

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "HH";

export const statusLabel = (status = "") => {
  const map = {
    pending: "Pending",
    shortlisted: "Shortlisted",
    rejected: "Rejected",
    hired: "Hired",
    withdrawn: "Withdrawn",
    active: "Active",
    expired: "Expired",
  };
  return map[status] || status;
};

export const jobStatus = (job = {}) => {
  const deadlinePassed =
    job.deadline && new Date(job.deadline).getTime() < Date.now();
  return job.expired || deadlinePassed ? "expired" : "active";
};

export const truncate = (text = "", length = 140) =>
  text.length > length ? `${text.slice(0, length).trim()}…` : text;

export const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export const profileCompletion = (user) => {
  if (!user) return 0;
  const checks = [
    user.name,
    user.email,
    user.phone,
    user.avatar?.url,
    user.profile?.headline,
    user.profile?.location,
    user.profile?.bio,
  ];
  if (user.role === "Employer") {
    checks.push(
      user.profile?.companyName,
      user.profile?.companyWebsite,
      user.profile?.industry,
      user.profile?.companyDescription
    );
  } else {
    checks.push(
      user.resume?.url,
      user.skills?.length > 0,
      user.education?.length > 0,
      user.experience?.length > 0
    );
  }
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
};
