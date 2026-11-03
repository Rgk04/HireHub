import ErrorHandler from "./error.js";

const buckets = new Map();

const cleanup = () => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

export const rateLimit = ({
  windowMs = 15 * 60 * 1000,
  max = 300,
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, _res, next) => {
    if (buckets.size > 5000) cleanup();

    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      return next(
        new ErrorHandler(
          `${message} Try again in ${retryAfter} seconds.`,
          429
        )
      );
    }

    next();
  };
};
