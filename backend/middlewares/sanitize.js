const cleanValue = (value) => {
  if (Array.isArray(value)) return value.map(cleanValue);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const cleaned = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      cleaned[key] = cleanValue(nested);
    }
    return cleaned;
  }
  if (typeof value === "string") {
    return value.replace(/\0/g, "").trim();
  }
  return value;
};

/**
 * Removes MongoDB operator keys such as $gt and dotted keys from the body.
 * Controllers only read known query keys, so query strings are not merged
 * into Mongo filters directly.
 */
export const sanitizeRequest = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = cleanValue(req.body);
  }
  if (req.params && typeof req.params === "object") {
    req.params = cleanValue(req.params);
  }
  next();
};

export const cleanValueExport = cleanValue;
