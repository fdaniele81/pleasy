import logger from "./logger.js";

export function handleError(res, err, defaultMessage) {
  logger.error(defaultMessage, {
    message: err.message,
    statusCode: err.statusCode,
    code: err.code,
    stack: err.stack,
  });
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.code || err.message,
      message: err.message,
    });
  }
  const isProduction = process.env.NODE_ENV === "production";
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: isProduction ? "An internal error occurred" : (err.message || defaultMessage),
  });
}

export function serviceError(code, message, statusCode) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export function validationError(code, message, statusCode = 400) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}
