class ErrorHandler extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (req, _res, next) => {
  next(new ErrorHandler(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof Error)) {
    error = new ErrorHandler(String(error || "Internal Server Error"), 500);
  }
  if (!error.statusCode) error.statusCode = 500;
  if (!error.message) error.message = "Internal Server Error";

  if (error.name === "CastError") {
    error = new ErrorHandler(
      `Invalid value for ${error.path || "field"}.`,
      400
    );
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors || {}).map((item) => item.message);
    error = new ErrorHandler(messages[0] || "Validation failed.", 400);
    error.details = messages;
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "value";
    const friendly =
      field === "email" ? "An account with this email already exists." : "Duplicate value entered.";
    error = new ErrorHandler(friendly, 409);
  }

  if (error.name === "JsonWebTokenError") {
    error = new ErrorHandler("Invalid session token. Please log in again.", 401);
  }

  if (error.name === "TokenExpiredError") {
    error = new ErrorHandler("Your session has expired. Please log in again.", 401);
  }

  if (error.name === "LIMIT_FILE_SIZE") {
    error = new ErrorHandler("Uploaded file is too large.", 400);
  }

  if (error.type === "entity.too.large") {
    error = new ErrorHandler("Request payload is too large.", 413);
  }

  if (error.type === "entity.parse.failed") {
    error = new ErrorHandler("Malformed JSON request body.", 400);
  }

  if (error.code === "ENOTFOUND" || error.name === "MongooseServerSelectionError") {
    error = new ErrorHandler(
      "Database connection failed. Check that MongoDB is running and DB_URL is correct.",
      503
    );
  }

  if (error.statusCode >= 500) {
    console.error("Server error:", error);
  }

  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
  });
};

export default ErrorHandler;
